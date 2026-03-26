<?php

namespace App\Modules\Inventory\OpnameStok;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OpnameStokCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (OpnameStokEntity $item) => self::toItem($item))
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

	public static function toItem(OpnameStokEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'tanggal_opname' => optional($item->tanggal_opname)?->toDateString(),
			'stok_sistem' => (float) $item->stok_sistem,
			'stok_fisik' => (float) $item->stok_fisik,
			'selisih' => (float) $item->selisih,
			'alasan' => $item->alasan,
			'status' => $item->status,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
