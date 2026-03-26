<?php

namespace App\Modules\Inventory\MutasiStok;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MutasiStokCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (MutasiStokEntity $item) => self::toItem($item))
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

	public static function toItem(MutasiStokEntity $item): array
	{
		return [
			'id' => $item->id,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'satuan' => $item->bahanBaku?->satuan,
			'user_id' => $item->user_id,
			'user_name' => $item->user?->name,
			'reference_type' => $item->reference_type,
			'reference_id' => $item->reference_id,
			'reference_code' => $item->reference_code,
			'direction' => $item->direction,
			'qty' => (float) $item->qty,
			'stok_sebelum' => $item->stok_sebelum !== null ? (float) $item->stok_sebelum : null,
			'stok_sesudah' => $item->stok_sesudah !== null ? (float) $item->stok_sesudah : null,
			'nilai_satuan' => $item->nilai_satuan !== null ? (float) $item->nilai_satuan : null,
			'nilai_total' => $item->nilai_total !== null ? (float) $item->nilai_total : null,
			'lokasi_asal' => $item->lokasi_asal,
			'lokasi_tujuan' => $item->lokasi_tujuan,
			'catatan' => $item->catatan,
			'occurred_at' => optional($item->occurred_at)?->toDateTimeString(),
			'created_at' => optional($item->created_at)?->toDateTimeString(),
		];
	}
}
