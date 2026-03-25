<?php

namespace App\Modules\Meja\ReservasiMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReservasiMejaCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ReservasiMejaEntity $item) => self::toItem($item))
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

	public static function toItem(ReservasiMejaEntity $item): array
	{
		return [
			'id' => $item->id,
			'data_meja_id' => $item->data_meja_id,
			'meja_nama' => $item->meja?->nama,
			'meja_nomor' => $item->meja?->nomor_meja,
			'kode' => $item->kode,
			'nama_pelanggan' => $item->nama_pelanggan,
			'no_hp' => $item->no_hp,
			'waktu_reservasi' => optional($item->waktu_reservasi)?->toDateTimeString(),
			'jumlah_tamu' => (int) $item->jumlah_tamu,
			'status' => $item->status,
			'catatan' => $item->catatan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
