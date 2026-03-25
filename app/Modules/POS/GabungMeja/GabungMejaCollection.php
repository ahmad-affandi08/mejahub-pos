<?php

namespace App\Modules\POS\GabungMeja;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GabungMejaCollection
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
				'items_count' => $order->items->count(),
			];
		})->values()->all();
	}

	public static function logs(Collection $logs): array
	{
		return $logs->map(function (GabungMejaEntity $log) {
			$sumberIds = DB::table('pos_gabung_meja_detail')
				->where('gabung_meja_id', $log->id)
				->pluck('pesanan_sumber_id')
				->map(fn ($id) => (int) $id)
				->values()
				->all();

			return [
				'id' => $log->id,
				'pesanan_target_id' => $log->pesanan_target_id,
				'pesanan_sumber_ids' => $sumberIds,
				'catatan' => $log->catatan,
				'merged_at' => optional($log->merged_at)->toDateTimeString(),
			];
		})->values()->all();
	}
}
