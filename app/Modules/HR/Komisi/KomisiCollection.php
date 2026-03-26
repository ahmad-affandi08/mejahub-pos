<?php

namespace App\Modules\HR\Komisi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KomisiCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (KomisiEntity $item) => self::toItem($item))
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

	public static function toItem(KomisiEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'pegawai_id' => $item->pegawai_id,
			'pegawai_nama' => $item->pegawai?->nama,
			'periode' => $item->periode,
			'dasar_perhitungan' => (float) $item->dasar_perhitungan,
			'persentase' => (float) $item->persentase,
			'nominal' => (float) $item->nominal,
			'status' => $item->status,
			'catatan' => $item->catatan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
