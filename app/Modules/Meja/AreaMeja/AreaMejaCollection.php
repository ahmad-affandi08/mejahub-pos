<?php

namespace App\Modules\Meja\AreaMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AreaMejaCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (AreaMejaEntity $item) => self::toItem($item))
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

	public static function toItem(AreaMejaEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'urutan' => (int) $item->urutan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
