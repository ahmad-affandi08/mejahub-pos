<?php

namespace App\Modules\POS\RefundPesanan;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Collection;

class RefundPesananCollection
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
				'waktu_bayar' => optional($order->waktu_bayar)->toDateTimeString(),
			];
		})->values()->all();
	}

	public static function logs(Collection $logs): array
	{
		return $logs->map(fn (RefundPesananEntity $log) => [
			'id' => $log->id,
			'kode' => $log->kode,
			'pesanan_id' => $log->pesanan_id,
			'nominal' => (float) $log->nominal,
			'metode' => $log->metode,
			'alasan' => $log->alasan,
			'status' => $log->status,
			'refunded_at' => optional($log->refunded_at)->toDateTimeString(),
		])->values()->all();
	}
}
