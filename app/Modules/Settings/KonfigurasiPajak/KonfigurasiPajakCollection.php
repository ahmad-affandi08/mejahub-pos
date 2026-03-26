<?php

namespace App\Modules\Settings\KonfigurasiPajak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KonfigurasiPajakCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (KonfigurasiPajakEntity $item) => self::toItem($item))
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

	public static function toItem(KonfigurasiPajakEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'jenis' => $item->jenis,
			'nilai' => (float) $item->nilai,
			'applies_to' => $item->applies_to,
			'is_inclusive' => (bool) $item->is_inclusive,
			'is_active' => (bool) $item->is_active,
			'is_default' => (bool) $item->is_default,
			'urutan' => (int) $item->urutan,
			'keterangan' => $item->keterangan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
