<?php

namespace App\Modules\Finance\PettyCash;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PettyCashCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PettyCashEntity $item) => self::toItem($item))
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

	public static function toItem(PettyCashEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'tanggal' => optional($item->tanggal)?->toDateString(),
			'jenis_transaksi' => $item->jenis_transaksi,
			'jenis_arus' => $item->jenis_arus,
			'nominal' => (float) $item->nominal,
			'saldo_setelah' => (float) $item->saldo_setelah,
			'status_approval' => $item->status_approval,
			'deskripsi' => $item->deskripsi,
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
