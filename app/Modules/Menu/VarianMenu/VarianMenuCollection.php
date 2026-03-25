<?php

namespace App\Modules\Menu\VarianMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class VarianMenuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (VarianMenuEntity $item) => self::toItem($item))
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

	public static function toItem(VarianMenuEntity $item): array
	{
		return [
			'id' => $item->id,
			'data_menu_id' => $item->data_menu_id,
			'data_menu_nama' => $item->dataMenu?->nama,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'harga_tambahan' => (float) $item->harga_tambahan,
			'urutan' => (int) $item->urutan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
