<?php

namespace App\Modules\POS\Pembayaran;

class PembayaranCollection
{
	public static function toItem(PembayaranEntity $payment): array
	{
		return [
			'id' => $payment->id,
			'kode' => $payment->kode,
			'pesanan_id' => $payment->pesanan_id,
			'shift_id' => $payment->shift_id,
			'user_id' => $payment->user_id,
			'metode_bayar' => $payment->metode_bayar,
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
