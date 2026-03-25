<?php

namespace App\Modules\POS\GabungMeja;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Modules\POS\PesananMasuk\PesananMasukItemEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GabungMejaService
{
	public function submittedOrders(): Collection
	{
		return PesananMasukEntity::query()
			->with(['meja:id,nama', 'items'])
			->where('status', 'submitted')
			->latest('id')
			->limit(80)
			->get();
	}

	public function recentLogs(): Collection
	{
		return GabungMejaEntity::query()
			->latest('id')
			->limit(20)
			->get();
	}

	public function mergeOrders(int $targetOrderId, array $sourceOrderIds, ?int $userId = null, ?string $catatan = null): GabungMejaEntity
	{
		return DB::transaction(function () use ($targetOrderId, $sourceOrderIds, $userId, $catatan) {
			$target = PesananMasukEntity::query()
				->with('items')
				->where('status', 'submitted')
				->findOrFail($targetOrderId);

			$sourceIds = collect($sourceOrderIds)
				->map(fn ($id) => (int) $id)
				->filter(fn ($id) => $id > 0 && $id !== $targetOrderId)
				->unique()
				->values();

			if ($sourceIds->isEmpty()) {
				abort(422, 'Pilih minimal satu pesanan sumber untuk digabung.');
			}

			$sources = PesananMasukEntity::query()
				->with('items')
				->whereIn('id', $sourceIds->all())
				->where('status', 'submitted')
				->get();

			if ($sources->count() !== $sourceIds->count()) {
				abort(422, 'Sebagian pesanan sumber tidak valid atau bukan status submitted.');
			}

			foreach ($sources as $sourceOrder) {
				foreach ($sourceOrder->items as $sourceItem) {
					$targetItem = PesananMasukItemEntity::query()
						->where('pesanan_id', $target->id)
						->where('data_menu_id', $sourceItem->data_menu_id)
						->where('harga_satuan', $sourceItem->harga_satuan)
						->where('nama_menu', $sourceItem->nama_menu)
						->where('catatan', $sourceItem->catatan)
						->first();

					if ($targetItem) {
						$nextQty = (int) $targetItem->qty + (int) $sourceItem->qty;
						$hargaSatuan = (float) $targetItem->harga_satuan;

						$targetItem->update([
							'qty' => $nextQty,
							'subtotal' => $nextQty * $hargaSatuan,
						]);

						$sourceItem->delete();
						continue;
					}

					$sourceItem->update([
						'pesanan_id' => $target->id,
					]);
				}

				$sourceOrder->update([
					'status' => 'merged',
					'total' => 0,
					'subtotal' => 0,
					'catatan' => trim((string) ($sourceOrder->catatan . ' | Digabung ke ' . $target->kode)),
				]);
			}

			$this->recalculateOrder($target->id);

			$log = GabungMejaEntity::query()->create([
				'pesanan_target_id' => $target->id,
				'user_id' => $userId,
				'catatan' => $catatan,
				'merged_at' => now(),
			]);

			foreach ($sourceIds as $sourceId) {
				DB::table('pos_gabung_meja_detail')->insert([
					'gabung_meja_id' => $log->id,
					'pesanan_sumber_id' => $sourceId,
					'created_at' => now(),
					'updated_at' => now(),
				]);
			}

			return $log;
		});
	}

	private function recalculateOrder(int $orderId): void
	{
		$order = PesananMasukEntity::query()->findOrFail($orderId);

		$subtotal = (float) PesananMasukItemEntity::query()
			->where('pesanan_id', $orderId)
			->sum('subtotal');

		$total = $subtotal - (float) $order->diskon + (float) $order->pajak + (float) $order->service_charge;

		$order->update([
			'subtotal' => $subtotal,
			'total' => max($total, 0),
		]);
	}
}
