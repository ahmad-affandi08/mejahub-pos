<?php

namespace App\Modules\Inventory\PurchaseOrder;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseOrderService
{
	public function paginate(string $search = '', string $status = '', int $perPage = 10): LengthAwarePaginator
	{
		return PurchaseOrderEntity::query()
			->with(['supplier:id,nama', 'items.bahanBaku:id,nama'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhereHas('supplier', fn ($supplierQuery) => $supplierQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->when($status !== '', fn ($query) => $query->where('status', $status))
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload, ?int $userId = null): PurchaseOrderEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$items = collect($payload['items'] ?? []);

			if ($items->isEmpty()) {
				throw new PosDomainException('Minimal satu item PO wajib diisi.');
			}

			$kode = trim((string) ($payload['kode'] ?? ''));
			if ($kode === '') {
				$kode = $this->generateCode();
			}

			$po = PurchaseOrderEntity::query()->create([
				'supplier_id' => $payload['supplier_id'] ?? null,
				'user_id' => $userId,
				'kode' => $kode,
				'tanggal_po' => $payload['tanggal_po'] ?? now()->toDateString(),
				'status' => $payload['status'] ?? 'draft',
				'total' => 0,
				'catatan' => $payload['catatan'] ?? null,
			]);

			$total = $this->syncItems($po, $items);
			if ($total <= 0) {
				throw new PosDomainException('Item PO tidak valid. Cek qty dan satuan input.');
			}
			$po->update(['total' => $total]);

			return $po->load(['supplier:id,nama', 'items.bahanBaku:id,nama']);
		});
	}

	public function update(int $id, array $payload): PurchaseOrderEntity
	{
		return DB::transaction(function () use ($id, $payload) {
			$po = PurchaseOrderEntity::query()->with('items')->findOrFail($id);
			$items = collect($payload['items'] ?? []);

			if ($items->isEmpty()) {
				throw new PosDomainException('Minimal satu item PO wajib diisi.');
			}

			$po->update([
				'supplier_id' => $payload['supplier_id'] ?? null,
				'tanggal_po' => $payload['tanggal_po'] ?? now()->toDateString(),
				'status' => $payload['status'] ?? $po->status,
				'catatan' => $payload['catatan'] ?? null,
			]);

			$total = $this->syncItems($po, $items);
			if ($total <= 0) {
				throw new PosDomainException('Item PO tidak valid. Cek qty dan satuan input.');
			}
			$po->update(['total' => $total]);

			return $po->load(['supplier:id,nama', 'items.bahanBaku:id,nama']);
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$po = PurchaseOrderEntity::query()->findOrFail($id);
			PurchaseOrderItemEntity::query()->where('purchase_order_id', $po->id)->delete();
			$po->delete();
		});
	}

	private function syncItems(PurchaseOrderEntity $po, Collection $items): float
	{
		PurchaseOrderItemEntity::query()->where('purchase_order_id', $po->id)->delete();

		$total = 0;
		$bahanMap = BahanBakuEntity::query()
			->whereIn('id', $items->pluck('bahan_baku_id')->filter()->map(fn ($id) => (int) $id)->all())
			->get(['id', 'satuan', 'satuan_kecil', 'satuan_besar', 'konversi_besar_ke_kecil', 'default_satuan_beli'])
			->keyBy('id');

		foreach ($items as $item) {
			$bahanId = (int) ($item['bahan_baku_id'] ?? 0);
			$bahan = $bahanMap->get($bahanId);

			if (!$bahan) {
				continue;
			}

			$qtyInput = (float) ($item['qty_input'] ?? $item['qty_pesan'] ?? 0);
			$satuanInput = trim((string) ($item['satuan_input'] ?? $bahan->default_satuan_beli ?? $bahan->satuan_kecil ?? $bahan->satuan));
			$konversi = $this->resolveKonversiKeKecil($bahan, $satuanInput);
			$qtyPesan = round($qtyInput * $konversi, 3);

			if ($qtyPesan <= 0) {
				continue;
			}

			$hargaSatuan = (float) ($item['harga_satuan'] ?? 0);
			$subtotal = $qtyPesan * $hargaSatuan;

			PurchaseOrderItemEntity::query()->create([
				'purchase_order_id' => $po->id,
				'bahan_baku_id' => $bahanId,
				'qty_pesan' => $qtyPesan,
				'qty_input' => $qtyInput,
				'satuan_input' => $satuanInput,
				'konversi_ke_kecil' => $konversi,
				'qty_diterima' => 0,
				'harga_satuan' => $hargaSatuan,
				'subtotal' => $subtotal,
				'catatan' => $item['catatan'] ?? null,
			]);

			$total += $subtotal;
		}

		return $total;
	}

	private function resolveKonversiKeKecil(BahanBakuEntity $bahan, string $satuanInput): float
	{
		$unit = strtolower(trim($satuanInput));
		$satuanKecil = strtolower(trim((string) ($bahan->satuan_kecil ?: $bahan->satuan)));
		$satuanBesar = strtolower(trim((string) ($bahan->satuan_besar ?? '')));

		if ($satuanBesar !== '' && $unit === $satuanBesar) {
			return max(1, (float) ($bahan->konversi_besar_ke_kecil ?? 1));
		}

		if ($unit === '' || $unit === $satuanKecil) {
			return 1;
		}

		return 1;
	}

	private function generateCode(): string
	{
		do {
			$code = 'PO-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (PurchaseOrderEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
