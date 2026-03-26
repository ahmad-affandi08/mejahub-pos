<?php

namespace App\Modules\Inventory\ResepBOM;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ResepBOMCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ResepBOMEntity $item) => self::toItem($item))
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

	public static function toItem(ResepBOMEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'data_menu_id' => $item->data_menu_id,
			'menu_nama' => $item->menu?->nama,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'qty_kebutuhan' => (float) $item->qty_kebutuhan,
			'satuan' => $item->satuan ?? $item->bahanBaku?->satuan,
			'referensi_porsi' => (float) $item->referensi_porsi,
			'catatan' => $item->catatan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
