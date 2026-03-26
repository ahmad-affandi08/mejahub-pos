<?php

namespace App\Modules\HR\PengaturanShift;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengaturanShiftCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (PengaturanShiftEntity $item) => self::toItem($item))
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

    public static function toItem(PengaturanShiftEntity $item): array
    {
        return [
            'id' => $item->id,
            'kode' => $item->kode,
            'nama' => $item->nama,
            'jam_masuk' => $item->jam_masuk,
            'jam_keluar' => $item->jam_keluar,
            'toleransi_telat_menit' => (int) $item->toleransi_telat_menit,
            'toleransi_pulang_cepat_menit' => (int) $item->toleransi_pulang_cepat_menit,
            'lintas_hari' => (bool) $item->lintas_hari,
            'latitude' => $item->latitude,
            'longitude' => $item->longitude,
            'radius_meter' => (int) $item->radius_meter,
            'require_face_verification' => (bool) $item->require_face_verification,
            'require_location_validation' => (bool) $item->require_location_validation,
            'is_active' => (bool) $item->is_active,
            'created_at' => optional($item->created_at)?->toDateTimeString(),
            'updated_at' => optional($item->updated_at)?->toDateTimeString(),
        ];
    }
}
