<?php

namespace App\Modules\CRM\Membership;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MembershipCollection
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
			'tier' => (string) ($item->tier ?? 'Basic'),
			'total_transaksi' => (int) ($item->total_transaksi ?? 0),
			'total_belanja' => (float) ($item->total_belanja ?? 0),
			'rata_rata_transaksi' => (float) ($item->rata_rata_transaksi ?? 0),
			'terakhir_transaksi' => $item->terakhir_transaksi,
		];
	}
}
