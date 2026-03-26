<?php

namespace App\Modules\HR\JadwalShift;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class JadwalShiftCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (JadwalShiftEntity $item) => self::toItem($item))
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

    public static function toItem(JadwalShiftEntity $item): array
    {
        return [
            'id' => $item->id,
            'kode' => $item->kode,
            'pegawai_id' => $item->pegawai_id,
            'pegawai_nama' => $item->pegawai?->nama,
            'shift_id' => $item->shift_id,
            'shift_nama' => $item->shift?->nama,
            'shift_jam_masuk' => $item->shift?->jam_masuk,
            'shift_jam_keluar' => $item->shift?->jam_keluar,
            'tanggal' => optional($item->tanggal)?->toDateString(),
            'status' => $item->status,
            'sumber_jadwal' => $item->sumber_jadwal,
            'catatan' => $item->catatan,
            'is_active' => (bool) $item->is_active,
            'created_at' => optional($item->created_at)?->toDateTimeString(),
            'updated_at' => optional($item->updated_at)?->toDateTimeString(),
        ];
    }
}
