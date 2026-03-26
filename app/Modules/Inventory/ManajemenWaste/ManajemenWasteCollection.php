<?php

namespace App\Modules\Inventory\ManajemenWaste;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ManajemenWasteCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ManajemenWasteEntity $item) => self::toItem($item))
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

	public static function toItem(ManajemenWasteEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'tanggal_waste' => optional($item->tanggal_waste)?->toDateString(),
			'stok_sebelum' => (float) $item->stok_sebelum,
			'qty_waste' => (float) $item->qty_waste,
			'stok_setelah' => (float) $item->stok_setelah,
			'kategori_waste' => $item->kategori_waste,
			'alasan' => $item->alasan,
			'status' => $item->status,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
