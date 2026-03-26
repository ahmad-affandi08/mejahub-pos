<?php

namespace App\Modules\Inventory\MutasiStok;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MutasiStokService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

        return MutasiStokEntity::query()
            ->with([
                'bahanBaku:id,nama,satuan',
                'user:id,name',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('reference_code', 'like', '%' . $search . '%')
                        ->orWhere('reference_type', 'like', '%' . $search . '%')
                        ->orWhere('direction', 'like', '%' . $search . '%')
                        ->orWhere('lokasi_asal', 'like', '%' . $search . '%')
                        ->orWhere('lokasi_tujuan', 'like', '%' . $search . '%')
                        ->orWhere('catatan', 'like', '%' . $search . '%')
                        ->orWhereHas('bahanBaku', fn ($bahan) => $bahan->where('nama', 'like', '%' . $search . '%'))
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%' . $search . '%'));
                });
            })
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

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
