<?php

namespace App\Modules\Menu\KategoriMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KategoriMenuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (KategoriMenuEntity $item) => self::toItem($item))
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

	public static function toItem(KategoriMenuEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'is_active' => (bool) $item->is_active,
			'urutan' => (int) $item->urutan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
