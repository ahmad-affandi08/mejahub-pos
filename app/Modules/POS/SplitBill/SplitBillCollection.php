<?php

namespace App\Modules\POS\SplitBill;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Collection;

class SplitBillCollection
{
	public static function orders(Collection $orders): array
	{
		return $orders->map(function (PesananMasukEntity $order) {
			return [
				'id' => $order->id,
				'kode' => $order->kode,
				'meja_nama' => $order->meja?->nama,
				'nama_pelanggan' => $order->nama_pelanggan,
				'status' => $order->status,
				'total' => (float) $order->total,
				'items' => $order->items->map(fn ($item) => [
					'id' => $item->id,
					'nama_menu' => $item->nama_menu,
					'qty' => (int) $item->qty,
					'harga_satuan' => (float) $item->harga_satuan,
					'subtotal' => (float) $item->subtotal,
				])->values()->all(),
			];
		})->values()->all();
	}

	public static function logs(Collection $logs): array
	{
		return $logs->map(fn (SplitBillEntity $log) => [
			'id' => $log->id,
			'pesanan_asal_id' => $log->pesanan_asal_id,
			'pesanan_baru_id' => $log->pesanan_baru_id,
			'catatan' => $log->catatan,
			'split_at' => optional($log->split_at)->toDateTimeString(),
		])->values()->all();
	}
}
