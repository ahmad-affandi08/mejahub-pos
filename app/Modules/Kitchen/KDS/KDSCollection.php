<?php

namespace App\Modules\Kitchen\KDS;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KDSCollection
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
			'nama_pelanggan' => $item->nama_pelanggan,
			'status' => (string) ($item->status ?? '-'),
			'nama_meja' => $item->nama_meja,
			'nomor_meja' => $item->nomor_meja,
			'total_item' => (int) ($item->total_item ?? 0),
			'total_qty' => (int) ($item->total_qty ?? 0),
			'waktu_pesan' => $item->waktu_pesan,
		];
	}
}
