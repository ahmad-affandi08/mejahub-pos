<?php

namespace App\Modules\Finance\Hutang;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HutangCollection
{
    /**
     * Transform the paginator into an array.
     */
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (HutangEntity $hutang) => self::toItem($hutang))
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

    public static function toItem(HutangEntity $hutang): array
    {
        return [
            'id' => $hutang->id,
            'kode' => $hutang->kode,
            'supplier_nama' => $hutang->supplier ? $hutang->supplier->nama : '-',
            'tanggal_hutang' => $hutang->tanggal_hutang ? $hutang->tanggal_hutang->format('Y-m-d') : null,
            'jatuh_tempo' => $hutang->jatuh_tempo ? $hutang->jatuh_tempo->format('Y-m-d') : null,
            'nominal_hutang' => (float) $hutang->nominal_hutang,
            'sisa_hutang' => (float) $hutang->sisa_hutang,
            'status' => $hutang->status,
            'sumber_tipe' => $hutang->sumber_tipe,
            'catatan' => $hutang->catatan,
        ];
    }
}
