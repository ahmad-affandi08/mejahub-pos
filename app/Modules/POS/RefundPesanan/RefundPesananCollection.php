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
			'pesanan_kode' => $log->pesanan?->kode,
			'nama_pelanggan' => $log->pesanan?->nama_pelanggan,
			'meja_nama' => $log->pesanan?->meja?->nama,
			'kasir_nama' => $log->kasir?->name,
			'nominal' => (float) $log->nominal,
			'metode' => $log->metode,
			'alasan' => $log->alasan,
			'status' => $log->status,
			'refunded_at' => optional($log->refunded_at)->toDateTimeString(),
		])->values()->all();
	}

	public static function toReceipt(RefundPesananEntity $log): array
	{
		return [
			'tipe' => 'refund',
			'kode_transaksi' => $log->kode,
			'waktu' => optional($log->refunded_at)->toDateTimeString(),
			'kasir' => $log->kasir?->name,
			'pesanan_kode' => $log->pesanan?->kode,
			'nama_pelanggan' => $log->pesanan?->nama_pelanggan,
			'meja' => $log->pesanan?->meja?->nama,
			'items' => $log->pesanan?->items?->map(fn ($item) => [
				'nama_menu' => $item->nama_menu,
				'qty' => (int) $item->qty,
				'harga_satuan' => (float) $item->harga_satuan,
				'subtotal' => (float) $item->subtotal,
			])->values()->all() ?? [],
			'metode' => $log->metode,
			'nominal_refund' => (float) $log->nominal,
			'alasan' => $log->alasan,
		];
	}
}
