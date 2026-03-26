<?php

namespace App\Modules\Finance\ArusKas;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ArusKasCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (ArusKasEntity $item) => self::toItem($item))
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

	public static function toRekonsiliasi(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (RekonsiliasiKasEntity $item) => [
					'id' => $item->id,
					'tanggal' => optional($item->tanggal)?->toDateString(),
					'jenis_akun' => $item->jenis_akun,
					'saldo_sistem' => (float) $item->saldo_sistem,
					'saldo_aktual' => (float) $item->saldo_aktual,
					'selisih' => (float) $item->selisih,
					'status' => $item->status,
					'catatan' => $item->catatan,
					'created_at' => optional($item->created_at)?->toDateTimeString(),
				])
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

	public static function toItem(ArusKasEntity $item): array
	{
		return [
			'id' => $item->id,
			'tanggal' => optional($item->tanggal)?->toDateString(),
			'jenis_akun' => $item->jenis_akun,
			'jenis_arus' => $item->jenis_arus,
			'sumber_tipe' => $item->sumber_tipe,
			'sumber_id' => $item->sumber_id,
			'referensi_kode' => $item->referensi_kode,
			'kategori' => $item->kategori,
			'deskripsi' => $item->deskripsi,
			'nominal' => (float) $item->nominal,
			'status' => $item->status,
			'rekonsiliasi_status' => $item->rekonsiliasi_status,
			'is_system' => (bool) $item->is_system,
			'is_active' => (bool) $item->is_active,
			'catatan' => $item->catatan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
