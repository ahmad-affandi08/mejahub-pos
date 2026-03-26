<?php

namespace App\Modules\Finance\Pengeluaran;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengeluaranCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PengeluaranEntity $item) => self::toItem($item))
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

	public static function toItem(PengeluaranEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'tanggal' => optional($item->tanggal)?->toDateString(),
			'kategori_biaya' => $item->kategori_biaya,
			'metode_pembayaran' => $item->metode_pembayaran,
			'nominal' => (float) $item->nominal,
			'status_approval' => $item->status_approval,
			'deskripsi' => $item->deskripsi,
			'vendor_nama' => $item->vendor_nama,
			'nomor_bukti' => $item->nomor_bukti,
			'created_by' => $item->created_by,
			'approved_by' => $item->approved_by,
			'approved_at' => optional($item->approved_at)?->toDateTimeString(),
			'catatan' => $item->catatan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
