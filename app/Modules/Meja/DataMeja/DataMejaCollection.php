<?php

namespace App\Modules\Meja\DataMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DataMejaCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (DataMejaEntity $item) => self::toItem($item))
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

	public static function toItem(DataMejaEntity $item): array
	{
		return [
			'id' => $item->id,
			'area_meja_id' => $item->area_meja_id,
			'area_nama' => $item->area?->nama,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'nomor_meja' => $item->nomor_meja,
			'kapasitas' => (int) $item->kapasitas,
			'status' => $item->status,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
