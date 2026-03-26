<?php

namespace App\Modules\HR\PengaturanShift;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengaturanShiftService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return PengaturanShiftEntity::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('kode', 'like', '%' . $search . '%')
                        ->orWhere('nama', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('nama')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): PengaturanShiftEntity
    {
        return PengaturanShiftEntity::query()->create($this->normalizePayload($payload));
    }

    public function update(int $id, array $payload): PengaturanShiftEntity
    {
        $entity = PengaturanShiftEntity::query()->findOrFail($id);
        $entity->update($this->normalizePayload($payload));

        return $entity->refresh();
    }

    public function delete(int $id): void
    {
        $entity = PengaturanShiftEntity::query()->findOrFail($id);
        $entity->delete();
    }

    private function normalizePayload(array $payload): array
    {
        return [
            'kode' => $payload['kode'] ?? null,
            'nama' => $payload['nama'],
            'jam_masuk' => $payload['jam_masuk'],
            'jam_keluar' => $payload['jam_keluar'],
            'toleransi_telat_menit' => (int) ($payload['toleransi_telat_menit'] ?? 0),
            'toleransi_pulang_cepat_menit' => (int) ($payload['toleransi_pulang_cepat_menit'] ?? 0),
            'lintas_hari' => (bool) ($payload['lintas_hari'] ?? false),
            'latitude' => $payload['latitude'] ?? null,
            'longitude' => $payload['longitude'] ?? null,
            'radius_meter' => (int) ($payload['radius_meter'] ?? 100),
            'require_face_verification' => (bool) ($payload['require_face_verification'] ?? false),
            'require_location_validation' => (bool) ($payload['require_location_validation'] ?? true),
            'is_active' => (bool) ($payload['is_active'] ?? true),
        ];
    }
}
