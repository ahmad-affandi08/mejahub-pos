<?php

namespace App\Modules\Settings\MetodePembayaran;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MetodePembayaranCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (MetodePembayaranEntity $item) => self::toItem($item))
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

	public static function toItem(MetodePembayaranEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'tipe' => $item->tipe,
			'provider' => $item->provider,
			'nomor_rekening' => $item->nomor_rekening,
			'atas_nama' => $item->atas_nama,
			'biaya_persen' => (float) $item->biaya_persen,
			'biaya_flat' => (float) $item->biaya_flat,
			'is_active' => (bool) $item->is_active,
			'is_default' => (bool) $item->is_default,
			'requires_reference' => (bool) $item->requires_reference,
			'urutan' => (int) $item->urutan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
