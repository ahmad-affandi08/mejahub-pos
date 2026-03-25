<?php

namespace App\Modules\Menu\ModifierMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ModifierMenuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ModifierMenuEntity $item) => self::toItem($item))
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

	public static function toItem(ModifierMenuEntity $item): array
	{
		$opsi = json_decode((string) $item->opsi_json, true);

		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'tipe' => $item->tipe,
			'min_pilih' => (int) $item->min_pilih,
			'max_pilih' => (int) $item->max_pilih,
			'opsi' => is_array($opsi) ? $opsi : [],
			'urutan' => (int) $item->urutan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
