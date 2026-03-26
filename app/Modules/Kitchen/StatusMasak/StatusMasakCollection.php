<?php

namespace App\Modules\Kitchen\StatusMasak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StatusMasakCollection
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
			'kode_pesanan' => (string) ($item->kode_pesanan ?? '-'),
			'nama_pelanggan' => $item->nama_pelanggan,
			'nama_menu' => (string) ($item->nama_menu ?? '-'),
			'qty' => (int) ($item->qty ?? 0),
			'status_pesanan' => (string) ($item->status_pesanan ?? '-'),
			'status_masak' => (string) ($item->status_masak ?? 'queued'),
			'waktu_pesan' => $item->waktu_pesan,
		];
	}
}
