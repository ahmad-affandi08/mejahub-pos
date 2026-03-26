<?php

namespace App\Modules\CRM\PoinLoyalty;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PoinLoyaltyCollection
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
		$poinTerkumpul = (int) ($item->poin_terkumpul ?? 0);
		$estimasiTerpakai = (int) ($item->estimasi_poin_terpakai ?? 0);

		return [
			'nama_pelanggan' => (string) ($item->nama_pelanggan ?? 'Walk-in'),
			'total_transaksi' => (int) ($item->total_transaksi ?? 0),
			'total_belanja' => (float) ($item->total_belanja ?? 0),
			'poin_terkumpul' => $poinTerkumpul,
			'estimasi_poin_terpakai' => $estimasiTerpakai,
			'estimasi_saldo_poin' => max($poinTerkumpul - $estimasiTerpakai, 0),
			'terakhir_transaksi' => $item->terakhir_transaksi,
		];
	}
}
