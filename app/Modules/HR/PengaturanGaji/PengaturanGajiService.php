<?php

namespace App\Modules\HR\PengaturanGaji;

use App\Modules\HR\PengaturanGaji\PengaturanGajiEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengaturanGajiService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return PengaturanGajiEntity::query()
            ->with('pegawai:id,nama,jabatan')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->whereHas('pegawai', function ($pegawaiQuery) use ($search) {
                            $pegawaiQuery
                                ->where('nama', 'like', '%' . $search . '%')
                                ->orWhere('jabatan', 'like', '%' . $search . '%');
                        })
                        ->orWhere('catatan', 'like', '%' . $search . '%');
                });
            })
            ->orderByDesc('is_active')
            ->orderBy('pegawai_id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): PengaturanGajiEntity
    {
        return PengaturanGajiEntity::query()->create($this->normalizePayload($payload));
    }

    public function update(int $id, array $payload): PengaturanGajiEntity
    {
        $entity = PengaturanGajiEntity::query()->findOrFail($id);
        $entity->update($this->normalizePayload($payload));

        return $entity->refresh()->load('pegawai:id,nama,jabatan');
    }

    public function delete(int $id): void
    {
        $entity = PengaturanGajiEntity::query()->findOrFail($id);
        $entity->delete();
    }

    public function getActiveMapByPegawaiId(): array
    {
        return PengaturanGajiEntity::query()
            ->where('is_active', true)
            ->pluck('gaji_pokok', 'pegawai_id')
            ->map(fn ($value) => (float) $value)
            ->all();
    }

    public function getActivePolicyMapByPegawaiId(): array
    {
        return PengaturanGajiEntity::query()
            ->where('is_active', true)
            ->get(['pegawai_id', 'kebijakan_penggajian'])
            ->mapWithKeys(function (PengaturanGajiEntity $item) {
                return [
                    (int) $item->pegawai_id => $this->normalizePolicy($item->kebijakan_penggajian ?? []),
                ];
            })
            ->all();
    }

    private function normalizePayload(array $payload): array
    {
        return [
            'pegawai_id' => (int) $payload['pegawai_id'],
            'gaji_pokok' => (float) ($payload['gaji_pokok'] ?? 0),
            'kebijakan_penggajian' => $this->normalizePolicy($payload['kebijakan_penggajian'] ?? []),
            'catatan' => $payload['catatan'] ?? null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
        ];
    }

    private function normalizePolicy(array $policy): array
    {
        return [
            'aktifkan_kebijakan' => (bool) ($policy['aktifkan_kebijakan'] ?? true),
            'lembur_per_jam' => (float) ($policy['lembur_per_jam'] ?? 0),
            'lembur_min_menit' => (int) ($policy['lembur_min_menit'] ?? 60),
            'potong_izin' => (bool) ($policy['potong_izin'] ?? false),
            'potongan_per_izin' => (float) ($policy['potongan_per_izin'] ?? 0),
            'potong_sakit' => (bool) ($policy['potong_sakit'] ?? false),
            'potongan_per_sakit' => (float) ($policy['potongan_per_sakit'] ?? 0),
            'potong_alpha' => (bool) ($policy['potong_alpha'] ?? true),
            'potongan_per_alpha' => (float) ($policy['potongan_per_alpha'] ?? 0),
            'potong_terlambat' => (bool) ($policy['potong_terlambat'] ?? false),
            'potongan_per_terlambat' => (float) ($policy['potongan_per_terlambat'] ?? 0),
        ];
    }
}
