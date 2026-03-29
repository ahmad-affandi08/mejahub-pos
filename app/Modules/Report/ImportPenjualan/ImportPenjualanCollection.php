<?php

namespace App\Modules\Report\ImportPenjualan;

use App\Modules\Report\ImportPenjualan\ImportPenjualanEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ImportPenjualanCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (ImportPenjualanEntity $item) => self::toItem($item))
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

    public static function toItem(ImportPenjualanEntity $item): array
    {
        return [
            'id' => $item->id,
            'import_batch_code' => $item->import_batch_code,
            'source_filename' => $item->source_filename,
            'row_number' => $item->row_number,
            'no_transaksi' => $item->no_transaksi,
            'waktu_order' => optional($item->waktu_order)?->format('d-m-Y H:i:s'),
            'waktu_bayar' => optional($item->waktu_bayar)?->format('d-m-Y H:i:s'),
            'tanggal_transaksi' => optional($item->tanggal_transaksi)?->format('Y-m-d'),
            'outlet' => $item->outlet,
            'produk' => $item->produk,
            'jenis_order' => $item->jenis_order,
            'sisa_tagihan' => (float) $item->sisa_tagihan,
            'total_penjualan' => (float) $item->total_penjualan,
            'metode_pembayaran' => $item->metode_pembayaran,
            'bayar' => $item->bayar,
            'nama_order' => $item->nama_order,
            'is_active' => (bool) $item->is_active,
            'sync_status' => $item->sync_status,
            'synced_at' => optional($item->synced_at)?->toDateTimeString(),
            'sync_error' => $item->sync_error,
            'pos_pesanan_id' => $item->pos_pesanan_id,
            'pos_pembayaran_id' => $item->pos_pembayaran_id,
            'created_at' => optional($item->created_at)?->toDateTimeString(),
        ];
    }
}
