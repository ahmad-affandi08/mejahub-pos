<?php

namespace App\Modules\HR\PengaturanGaji;

use App\Modules\HR\PengaturanGaji\PengaturanGajiEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengaturanGajiCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (PengaturanGajiEntity $item) => self::toItem($item))
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

    public static function toItem(PengaturanGajiEntity $item): array
    {
        return [
            'id' => $item->id,
            'pegawai_id' => (int) $item->pegawai_id,
            'pegawai_nama' => $item->pegawai?->nama,
            'jabatan' => $item->pegawai?->jabatan,
            'gaji_pokok' => (float) $item->gaji_pokok,
            'kebijakan_penggajian' => $item->kebijakan_penggajian ?? [],
            'catatan' => $item->catatan,
            'is_active' => (bool) $item->is_active,
            'created_at' => optional($item->created_at)?->toDateTimeString(),
            'updated_at' => optional($item->updated_at)?->toDateTimeString(),
        ];
    }
}
