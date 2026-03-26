<?php

namespace App\Modules\POS\Pembayaran;

class PembayaranCollection
{
	public static function toListItem(PembayaranEntity $payment): array
	{
		return [
			'id' => $payment->id,
			'kode' => $payment->kode,
			'pesanan_id' => $payment->pesanan_id,
			'pesanan_kode' => $payment->pesanan?->kode,
			'nama_pelanggan' => $payment->pesanan?->nama_pelanggan,
			'meja_nama' => $payment->pesanan?->meja?->nama,
			'kasir_nama' => $payment->kasir?->name,
			'metode_bayar' => $payment->metode_bayar,
			'payment_details' => collect($payment->payment_details ?? [])->map(fn ($item) => [
				'metode_bayar' => $item['metode_bayar'] ?? null,
				'nominal' => (float) ($item['nominal'] ?? 0),
			])->values()->all(),
			'nominal_tagihan' => (float) $payment->nominal_tagihan,
			'nominal_dibayar' => (float) $payment->nominal_dibayar,
			'kembalian' => (float) $payment->kembalian,
			'status' => $payment->status,
			'waktu_bayar' => optional($payment->waktu_bayar)?->toDateTimeString(),
			'items' => $payment->pesanan?->items?->map(fn ($item) => [
				'nama_menu' => $item->nama_menu,
				'qty' => (int) $item->qty,
				'harga_satuan' => (float) $item->harga_satuan,
				'subtotal' => (float) $item->subtotal,
			])->values()->all() ?? [],
		];
	}

	public static function toReceipt(PembayaranEntity $payment): array
	{
		return [
			'tipe' => 'payment',
			'kode_transaksi' => $payment->kode,
			'waktu' => optional($payment->waktu_bayar)?->toDateTimeString(),
			'kasir' => $payment->kasir?->name,
			'pesanan_kode' => $payment->pesanan?->kode,
			'nama_pelanggan' => $payment->pesanan?->nama_pelanggan,
			'meja' => $payment->pesanan?->meja?->nama,
			'items' => $payment->pesanan?->items?->map(fn ($item) => [
				'nama_menu' => $item->nama_menu,
				'qty' => (int) $item->qty,
				'harga_satuan' => (float) $item->harga_satuan,
				'subtotal' => (float) $item->subtotal,
			])->values()->all() ?? [],
			'metode' => $payment->metode_bayar,
			'payment_details' => collect($payment->payment_details ?? [])->map(fn ($item) => [
				'metode_bayar' => $item['metode_bayar'] ?? null,
				'nominal' => (float) ($item['nominal'] ?? 0),
			])->values()->all(),
			'nominal_tagihan' => (float) $payment->nominal_tagihan,
			'nominal_dibayar' => (float) $payment->nominal_dibayar,
			'kembalian' => (float) $payment->kembalian,
		];
	}

	public static function toItem(PembayaranEntity $payment): array
	{
		return [
			'id' => $payment->id,
			'kode' => $payment->kode,
			'pesanan_id' => $payment->pesanan_id,
			'shift_id' => $payment->shift_id,
			'user_id' => $payment->user_id,
			'metode_bayar' => $payment->metode_bayar,
			'payment_details' => collect($payment->payment_details ?? [])->map(fn ($item) => [
				'metode_bayar' => $item['metode_bayar'] ?? null,
				'nominal' => (float) ($item['nominal'] ?? 0),
			])->values()->all(),
			'nominal_tagihan' => (float) $payment->nominal_tagihan,
			'nominal_dibayar' => (float) $payment->nominal_dibayar,
			'kembalian' => (float) $payment->kembalian,
			'status' => $payment->status,
			'catatan' => $payment->catatan,
			'waktu_bayar' => optional($payment->waktu_bayar)?->toDateTimeString(),
			'pesanan_kode' => $payment->pesanan?->kode,
		];
	}
}
