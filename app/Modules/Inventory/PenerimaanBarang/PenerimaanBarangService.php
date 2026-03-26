<?php

namespace App\Modules\Inventory\PenerimaanBarang;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\PurchaseOrder\PurchaseOrderEntity;
use App\Modules\Inventory\PurchaseOrder\PurchaseOrderItemEntity;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PenerimaanBarangService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return PenerimaanBarangEntity::query()
			->with(['supplier:id,nama', 'purchaseOrder:id,kode', 'items.bahanBaku:id,nama'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('nomor_surat_jalan', 'like', '%' . $search . '%')
						->orWhereHas('supplier', fn ($supplierQuery) => $supplierQuery->where('nama', 'like', '%' . $search . '%'))
						->orWhereHas('purchaseOrder', fn ($poQuery) => $poQuery->where('kode', 'like', '%' . $search . '%'));
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload, ?int $userId = null): PenerimaanBarangEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$items = collect($payload['items'] ?? [])->filter(fn ($item) => (float) ($item['qty_diterima'] ?? 0) > 0);

			if ($items->isEmpty()) {
				throw new PosDomainException('Minimal satu item penerimaan wajib diisi.');
			}

			$kode = trim((string) ($payload['kode'] ?? ''));
			if ($kode === '') {
				$kode = $this->generateCode();
			}

			$receipt = PenerimaanBarangEntity::query()->create([
				'purchase_order_id' => $payload['purchase_order_id'] ?? null,
				'supplier_id' => $payload['supplier_id'] ?? null,
				'user_id' => $userId,
				'kode' => $kode,
				'nomor_surat_jalan' => $payload['nomor_surat_jalan'] ?? null,
				'tanggal_terima' => $payload['tanggal_terima'] ?? now()->toDateString(),
				'status' => $payload['status'] ?? 'received',
				'total' => 0,
				'catatan' => $payload['catatan'] ?? null,
			]);

			$total = $this->syncItemsAndStock($receipt, $items);
			$receipt->update(['total' => $total]);

			$this->syncPurchaseOrderReceiptState($receipt->purchase_order_id);

			return $receipt->load(['supplier:id,nama', 'purchaseOrder:id,kode', 'items.bahanBaku:id,nama']);
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$receipt = PenerimaanBarangEntity::query()->findOrFail($id);

			foreach ($receipt->items()->get() as $item) {
				$bahan = BahanBakuEntity::query()->find($item->bahan_baku_id);
				if ($bahan) {
					$stokSaatIni = (float) $bahan->stok_saat_ini;
					$bahan->update([
						'stok_saat_ini' => max(0, $stokSaatIni - (float) $item->qty_diterima),
					]);
				}

				if ($item->purchase_order_item_id) {
					$poItem = PurchaseOrderItemEntity::query()->find($item->purchase_order_item_id);
					if ($poItem) {
						$poItem->update([
							'qty_diterima' => max(0, (float) $poItem->qty_diterima - (float) $item->qty_diterima),
						]);
					}
				}
			}

			PenerimaanBarangItemEntity::query()->where('penerimaan_barang_id', $receipt->id)->delete();
			$poId = $receipt->purchase_order_id;
			$receipt->delete();

			$this->syncPurchaseOrderReceiptState($poId);
		});
	}

	private function syncItemsAndStock(PenerimaanBarangEntity $receipt, Collection $items): float
	{
		$total = 0;

		foreach ($items as $item) {
			$qtyDiterima = (float) ($item['qty_diterima'] ?? 0);
			$hargaSatuan = (float) ($item['harga_satuan'] ?? 0);
			$subtotal = $qtyDiterima * $hargaSatuan;

			$poItemId = isset($item['purchase_order_item_id']) && (int) $item['purchase_order_item_id'] > 0
				? (int) $item['purchase_order_item_id']
				: null;

			PenerimaanBarangItemEntity::query()->create([
				'penerimaan_barang_id' => $receipt->id,
				'purchase_order_item_id' => $poItemId,
				'bahan_baku_id' => (int) $item['bahan_baku_id'],
				'qty_diterima' => $qtyDiterima,
				'harga_satuan' => $hargaSatuan,
				'subtotal' => $subtotal,
				'catatan' => $item['catatan'] ?? null,
			]);

			$bahan = BahanBakuEntity::query()->findOrFail((int) $item['bahan_baku_id']);
			$bahan->update([
				'stok_saat_ini' => (float) $bahan->stok_saat_ini + $qtyDiterima,
				'harga_beli_terakhir' => $hargaSatuan,
			]);

			if ($poItemId) {
				$poItem = PurchaseOrderItemEntity::query()->find($poItemId);
				if ($poItem) {
					$poItem->update([
						'qty_diterima' => (float) $poItem->qty_diterima + $qtyDiterima,
					]);
				}
			}

			$total += $subtotal;
		}

		return $total;
	}

	private function syncPurchaseOrderReceiptState(?int $purchaseOrderId): void
	{
		if (!$purchaseOrderId) {
			return;
		}

		$po = PurchaseOrderEntity::query()->with('items')->find($purchaseOrderId);
		if (!$po) {
			return;
		}

		$totalPesan = (float) $po->items->sum(fn ($item) => (float) $item->qty_pesan);
		$totalDiterima = (float) $po->items->sum(fn ($item) => (float) $item->qty_diterima);

		if ($totalDiterima <= 0) {
			$po->update(['status' => 'submitted']);
			return;
		}

		if ($totalDiterima < $totalPesan) {
			$po->update(['status' => 'partial']);
			return;
		}

		$po->update(['status' => 'received']);
	}

	private function generateCode(): string
	{
		do {
			$code = 'RCV-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (PenerimaanBarangEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
