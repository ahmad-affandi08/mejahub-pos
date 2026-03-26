<?php

namespace App\Modules\HR\Penggajian;

use App\Modules\HR\Penggajian\PenggajianEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PenggajianCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (PenggajianEntity $item) => self::toItem($item))
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

    public static function toItem(PenggajianEntity $item): array
    {
        return [
            'id' => $item->id,
            'kode' => $item->kode,
            'pegawai_id' => $item->pegawai_id,
            'pegawai_nama' => $item->pegawai?->nama,
            'periode' => $item->periode,
            'tanggal_pembayaran' => optional($item->tanggal_pembayaran)?->toDateString(),
            'gaji_pokok' => (float) $item->gaji_pokok,
            'tunjangan' => (float) $item->tunjangan,
            'lembur' => (float) $item->lembur,
            'bonus' => (float) $item->bonus,
            'potongan' => (float) $item->potongan,
            'total_gaji' => (float) $item->total_gaji,
            'jumlah_hadir' => (int) $item->jumlah_hadir,
            'jumlah_izin' => (int) $item->jumlah_izin,
            'jumlah_sakit' => (int) $item->jumlah_sakit,
            'jumlah_cuti' => (int) $item->jumlah_cuti,
            'jumlah_alpha' => (int) $item->jumlah_alpha,
            'jumlah_terlambat' => (int) $item->jumlah_terlambat,
            'generated_from_absensi' => (bool) $item->generated_from_absensi,
            'status' => $item->status,
            'catatan' => $item->catatan,
            'is_active' => (bool) $item->is_active,
            'created_at' => optional($item->created_at)?->toDateTimeString(),
            'updated_at' => optional($item->updated_at)?->toDateTimeString(),
        ];
    }
}
