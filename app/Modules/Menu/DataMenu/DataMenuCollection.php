<?php

namespace App\Modules\Menu\DataMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class DataMenuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (DataMenuEntity $item) => self::toItem($item))
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

	public static function toItem(DataMenuEntity $item): array
	{
		return [
			'id' => $item->id,
			'kategori_menu_id' => $item->kategori_menu_id,
			'kategori_nama' => $item->kategori?->nama,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'harga' => (float) $item->harga,
			'gambar' => $item->gambar,
			'gambar_url' => $item->gambar ? Storage::disk('public')->url('menu/' . $item->gambar) : null,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
