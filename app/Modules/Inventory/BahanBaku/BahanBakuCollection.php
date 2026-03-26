<?php

namespace App\Modules\Inventory\BahanBaku;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BahanBakuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (BahanBakuEntity $item) => self::toItem($item))
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

	public static function toItem(BahanBakuEntity $item): array
	{
		return [
			'id' => $item->id,
			'supplier_id' => $item->supplier_id,
			'supplier_nama' => $item->supplier?->nama,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'satuan' => $item->satuan,
			'harga_beli_terakhir' => (float) $item->harga_beli_terakhir,
			'stok_minimum' => (float) $item->stok_minimum,
			'stok_saat_ini' => (float) $item->stok_saat_ini,
			'keterangan' => $item->keterangan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
