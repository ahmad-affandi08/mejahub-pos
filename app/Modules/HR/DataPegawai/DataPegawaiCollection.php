<?php

namespace App\Modules\HR\DataPegawai;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DataPegawaiCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (DataPegawaiEntity $item) => self::toItem($item))
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

	public static function toItem(DataPegawaiEntity $item): array
	{
		return [
			'id' => $item->id,
			'user_id' => $item->user_id,
			'no_identitas' => $item->no_identitas,
			'nama' => $item->nama,
			'jabatan' => $item->jabatan,
			'nomor_telepon' => $item->nomor_telepon,
			'alamat' => $item->alamat,
			'is_active' => (bool) $item->is_active,
			'email' => $item->user?->email,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
