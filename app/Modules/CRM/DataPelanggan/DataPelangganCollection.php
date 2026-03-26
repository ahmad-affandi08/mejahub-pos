<?php

namespace App\Modules\CRM\DataPelanggan;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DataPelangganCollection
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
			'nama_pelanggan' => (string) ($item->nama_pelanggan ?? 'Walk-in'),
			'total_transaksi' => (int) ($item->total_transaksi ?? 0),
			'total_belanja' => (float) ($item->total_belanja ?? 0),
			'terakhir_transaksi' => $item->terakhir_transaksi,
		];
	}
}
