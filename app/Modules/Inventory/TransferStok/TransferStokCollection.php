<?php

namespace App\Modules\Inventory\TransferStok;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TransferStokCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (TransferStokEntity $item) => self::toItem($item))
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

	public static function toItem(TransferStokEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'tanggal_transfer' => optional($item->tanggal_transfer)?->toDateString(),
			'lokasi_asal' => $item->lokasi_asal,
			'lokasi_tujuan' => $item->lokasi_tujuan,
			'qty_transfer' => (float) $item->qty_transfer,
			'catatan' => $item->catatan,
			'status' => $item->status,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
