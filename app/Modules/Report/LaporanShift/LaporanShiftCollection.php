<?php

namespace App\Modules\Report\LaporanShift;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LaporanShiftCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (object $item) => self::toItem($item))
				->values()
				->all(),
			'meta' => [
				'current_page' => $paginator->currentPage(),
				'last_page' => $paginator->lastPage(),
				'per_page' => $paginator->perPage(),
				'total' => $paginator->total(),
			],
		];
	}

	public static function toItem(object $item): array
	{
		return [
			'id' => (int) ($item->id ?? 0),
			'kode' => (string) ($item->kode ?? '-'),
			'status' => (string) ($item->status ?? '-'),
			'kasir_nama' => $item->kasir_nama,
			'waktu_buka' => $item->waktu_buka,
			'waktu_tutup' => $item->waktu_tutup,
			'kas_awal' => (float) ($item->kas_awal ?? 0),
			'kas_aktual' => $item->kas_aktual !== null ? (float) $item->kas_aktual : null,
			'kas_sistem' => $item->kas_sistem !== null ? (float) $item->kas_sistem : null,
			'selisih' => $item->selisih !== null ? (float) $item->selisih : null,
			'jumlah_transaksi' => (int) ($item->jumlah_transaksi ?? 0),
			'total_pembayaran' => (int) ($item->total_pembayaran ?? 0),
			'total_penjualan' => (float) ($item->total_penjualan ?? 0),
		];
	}
}
