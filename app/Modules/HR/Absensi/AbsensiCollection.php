<?php

namespace App\Modules\HR\Absensi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AbsensiCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (AbsensiEntity $item) => self::toItem($item))
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

	public static function toItem(AbsensiEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'pegawai_id' => $item->pegawai_id,
			'pegawai_nama' => $item->pegawai?->nama,
			'shift_id' => $item->shift_id,
			'shift_nama' => $item->shift?->nama,
			'jadwal_shift_id' => $item->jadwal_shift_id,
			'jadwal_shift_kode' => $item->jadwalShift?->kode,
			'tanggal' => optional($item->tanggal)?->toDateString(),
			'jenis_absen' => $item->jenis_absen,
			'jam_masuk' => $item->jam_masuk,
			'jam_keluar' => $item->jam_keluar,
			'status' => $item->status,
			'metode_absen' => $item->metode_absen,
			'sumber_absen' => $item->sumber_absen,
			'foto_absen' => $item->foto_absen,
			'watermark_text' => $item->watermark_text,
			'latitude' => $item->latitude,
			'longitude' => $item->longitude,
			'lokasi_absen' => $item->lokasi_absen,
			'radius_meter' => $item->radius_meter,
			'dalam_radius' => $item->dalam_radius,
			'skor_wajah' => $item->skor_wajah,
			'status_verifikasi_wajah' => $item->status_verifikasi_wajah,
			'keterangan' => $item->keterangan,
			'is_active' => (bool) $item->is_active,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
