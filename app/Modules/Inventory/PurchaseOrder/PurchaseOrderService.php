<?php

namespace App\Modules\Inventory\PurchaseOrder;

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
			$items = collect($payload['items'] ?? [])->filter(fn ($item) => (float) ($item['qty_pesan'] ?? 0) > 0);

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
			$po->update(['total' => $total]);

			return $po->load(['supplier:id,nama', 'items.bahanBaku:id,nama']);
		});
	}

	public function update(int $id, array $payload): PurchaseOrderEntity
	{
		return DB::transaction(function () use ($id, $payload) {
			$po = PurchaseOrderEntity::query()->with('items')->findOrFail($id);
			$items = collect($payload['items'] ?? [])->filter(fn ($item) => (float) ($item['qty_pesan'] ?? 0) > 0);

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

		foreach ($items as $item) {
			$qtyPesan = (float) ($item['qty_pesan'] ?? 0);
			$hargaSatuan = (float) ($item['harga_satuan'] ?? 0);
			$subtotal = $qtyPesan * $hargaSatuan;

			PurchaseOrderItemEntity::query()->create([
				'purchase_order_id' => $po->id,
				'bahan_baku_id' => (int) $item['bahan_baku_id'],
				'qty_pesan' => $qtyPesan,
				'qty_diterima' => 0,
				'harga_satuan' => $hargaSatuan,
				'subtotal' => $subtotal,
				'catatan' => $item['catatan'] ?? null,
			]);

			$total += $subtotal;
		}

		return $total;
	}

	private function generateCode(): string
	{
		do {
			$code = 'PO-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (PurchaseOrderEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
