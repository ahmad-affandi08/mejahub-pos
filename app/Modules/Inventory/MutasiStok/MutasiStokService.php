<?php

namespace App\Modules\Inventory\MutasiStok;

class MutasiStokService
{
    public function record(array $payload): MutasiStokEntity
    {
        return MutasiStokEntity::query()->create([
            'bahan_baku_id' => $payload['bahan_baku_id'],
            'user_id' => $payload['user_id'] ?? null,
            'reference_type' => $payload['reference_type'] ?? null,
            'reference_id' => $payload['reference_id'] ?? null,
            'reference_code' => $payload['reference_code'] ?? null,
            'direction' => $payload['direction'] ?? null,
            'qty' => (float) ($payload['qty'] ?? 0),
            'stok_sebelum' => isset($payload['stok_sebelum']) ? (float) $payload['stok_sebelum'] : null,
            'stok_sesudah' => isset($payload['stok_sesudah']) ? (float) $payload['stok_sesudah'] : null,
            'nilai_satuan' => isset($payload['nilai_satuan']) ? (float) $payload['nilai_satuan'] : null,
            'nilai_total' => isset($payload['nilai_total']) ? (float) $payload['nilai_total'] : null,
            'lokasi_asal' => $payload['lokasi_asal'] ?? null,
            'lokasi_tujuan' => $payload['lokasi_tujuan'] ?? null,
            'catatan' => $payload['catatan'] ?? null,
            'occurred_at' => $payload['occurred_at'] ?? now(),
        ]);
    }
}
