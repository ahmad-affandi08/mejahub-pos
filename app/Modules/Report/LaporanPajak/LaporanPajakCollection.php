<?php

namespace App\Modules\Report\LaporanPajak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LaporanPajakCollection
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
			'tanggal' => $item->tanggal,
			'total_transaksi' => (int) ($item->total_transaksi ?? 0),
			'total_subtotal' => (float) ($item->total_subtotal ?? 0),
			'total_pajak' => (float) ($item->total_pajak ?? 0),
			'total_bruto' => (float) ($item->total_bruto ?? 0),
			'efektif_persen' => (float) ($item->efektif_persen ?? 0),
		];
	}
}
