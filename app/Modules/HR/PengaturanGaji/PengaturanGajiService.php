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

    private function normalizePayload(array $payload): array
    {
        return [
            'pegawai_id' => (int) $payload['pegawai_id'],
            'gaji_pokok' => (float) ($payload['gaji_pokok'] ?? 0),
            'catatan' => $payload['catatan'] ?? null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
        ];
    }
}
