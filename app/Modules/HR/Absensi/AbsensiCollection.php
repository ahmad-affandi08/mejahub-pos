<?php

namespace App\Modules\HR\Absensi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AbsensiCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (AbsensiEntity $item) => self::toItem($item))
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

	public static function toItem(AbsensiEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'pegawai_id' => $item->pegawai_id,
			'pegawai_nama' => $item->pegawai?->nama,
			'tanggal' => optional($item->tanggal)?->toDateString(),
			'jam_masuk' => $item->jam_masuk,
			'jam_keluar' => $item->jam_keluar,
			'status' => $item->status,
			'keterangan' => $item->keterangan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
