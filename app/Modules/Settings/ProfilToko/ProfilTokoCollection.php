<?php

namespace App\Modules\Settings\ProfilToko;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProfilTokoCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ProfilTokoEntity $item) => self::toItem($item))
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

	public static function toItem(ProfilTokoEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode_toko' => $item->kode_toko,
			'nama_toko' => $item->nama_toko,
			'nama_brand' => $item->nama_brand,
			'email' => $item->email,
			'telepon' => $item->telepon,
			'alamat' => $item->alamat,
			'kota' => $item->kota,
			'provinsi' => $item->provinsi,
			'kode_pos' => $item->kode_pos,
			'npwp' => $item->npwp,
			'logo_path' => $item->logo_path,
			'timezone' => $item->timezone,
			'mata_uang' => $item->mata_uang,
			'bahasa' => $item->bahasa,
			'is_default' => (bool) $item->is_default,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
