<?php

namespace App\Modules\POS\SplitBill;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Modules\POS\PesananMasuk\PesananMasukItemEntity;
use App\Support\PosDomainException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SplitBillService
{
	public function submittedOrders(): Collection
	{
		return PesananMasukEntity::query()
			->with(['meja:id,nama', 'items'])
			->where('status', 'submitted')
			->latest('id')
			->limit(50)
			->get();
	}

	public function recentLogs(): Collection
	{
		return SplitBillEntity::query()
			->latest('id')
			->limit(20)
			->get();
	}

	public function splitOrder(int $pesananId, array $itemSplits, ?int $userId = null, ?string $catatan = null): SplitBillEntity
	{
		return DB::transaction(function () use ($pesananId, $itemSplits, $userId, $catatan) {
			$order = PesananMasukEntity::query()
				->with('items')
				->where('status', 'submitted')
				->findOrFail($pesananId);

			$splitMap = collect($itemSplits)
				->mapWithKeys(fn (array $item) => [(int) ($item['pesanan_item_id'] ?? 0) => (int) ($item['qty'] ?? 0)])
				->filter(fn (int $qty) => $qty > 0);

			if ($splitMap->isEmpty()) {
				throw new PosDomainException('Pilih minimal satu item untuk split bill.');
			}

			$newOrder = PesananMasukEntity::query()->create([
				'kode' => $this->generateKode(),
				'data_meja_id' => $order->data_meja_id,
				'user_id' => $userId ?? $order->user_id,
				'nama_pelanggan' => $order->nama_pelanggan,
				'status' => 'submitted',
				'subtotal' => 0,
				'diskon' => 0,
				'pajak' => 0,
				'service_charge' => 0,
				'total' => 0,
				'catatan' => $catatan,
				'waktu_pesan' => now(),
			]);

			$splitItems = [];

			foreach ($order->items as $item) {
				$qtyDipindah = (int) ($splitMap[$item->id] ?? 0);

				if ($qtyDipindah <= 0) {
					continue;
				}

				if ($qtyDipindah > (int) $item->qty) {
					throw new PosDomainException('Qty split melebihi qty item asal.');
				}

				$hargaSatuan = (float) $item->harga_satuan;

				if ($qtyDipindah === (int) $item->qty) {
					$item->update([
						'pesanan_id' => $newOrder->id,
					]);
				} else {
					$sisaQty = (int) $item->qty - $qtyDipindah;
					$item->update([
						'qty' => $sisaQty,
						'subtotal' => $hargaSatuan * $sisaQty,
					]);

					PesananMasukItemEntity::query()->create([
						'pesanan_id' => $newOrder->id,
						'data_menu_id' => $item->data_menu_id,
						'nama_menu' => $item->nama_menu,
						'harga_satuan' => $hargaSatuan,
						'qty' => $qtyDipindah,
						'subtotal' => $hargaSatuan * $qtyDipindah,
						'catatan' => $item->catatan,
					]);
				}

				$splitItems[] = [
					'pesanan_item_asal_id' => $item->id,
					'qty_dipindah' => $qtyDipindah,
				];
			}

			if (empty($splitItems)) {
				throw new PosDomainException('Tidak ada item valid yang dipindahkan pada split bill.');
			}

			$this->recalculateOrder($order->id);
			$this->recalculateOrder($newOrder->id);

			$log = SplitBillEntity::query()->create([
				'pesanan_asal_id' => $order->id,
				'pesanan_baru_id' => $newOrder->id,
				'user_id' => $userId,
				'catatan' => $catatan,
				'split_at' => now(),
			]);

			foreach ($splitItems as $item) {
				DB::table('pos_split_bill_item')->insert([
					'split_bill_id' => $log->id,
					'pesanan_item_asal_id' => $item['pesanan_item_asal_id'],
					'qty_dipindah' => $item['qty_dipindah'],
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

	private function generateKode(): string
	{
		return 'ORD-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}
}
