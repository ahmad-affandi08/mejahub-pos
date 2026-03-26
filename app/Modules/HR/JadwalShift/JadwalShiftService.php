<?php

namespace App\Modules\HR\JadwalShift;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class JadwalShiftService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return JadwalShiftEntity::query()
            ->with([
                'pegawai:id,nama',
                'shift:id,nama,jam_masuk,jam_keluar',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('kode', 'like', '%' . $search . '%')
                        ->orWhere('status', 'like', '%' . $search . '%')
                        ->orWhere('tanggal', 'like', '%' . $search . '%')
                        ->orWhereHas('pegawai', function ($pegawaiQuery) use ($search) {
                            $pegawaiQuery->where('nama', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('shift', function ($shiftQuery) use ($search) {
                            $shiftQuery->where('nama', 'like', '%' . $search . '%');
                        });
                });
            })
            ->orderByDesc('tanggal')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): JadwalShiftEntity
    {
        return JadwalShiftEntity::query()->create($this->normalizePayload($payload, false));
    }

    public function update(int $id, array $payload): JadwalShiftEntity
    {
        $entity = JadwalShiftEntity::query()->findOrFail($id);
        $entity->update($this->normalizePayload($payload, false));

        return $entity->refresh()->load([
            'pegawai:id,nama',
            'shift:id,nama,jam_masuk,jam_keluar',
        ]);
    }

    public function delete(int $id): void
    {
        $entity = JadwalShiftEntity::query()->findOrFail($id);
        $entity->delete();
    }

    public function generate(array $payload): int
    {
        $startDate = Carbon::parse($payload['tanggal_mulai'])->startOfDay();
        $endDate = Carbon::parse($payload['tanggal_selesai'])->startOfDay();
        $days = $this->normalizeWeekdays($payload['hari_kerja'] ?? []);
        $pegawaiIds = collect($payload['pegawai_ids'] ?? [])->map(fn ($id) => (int) $id)->filter()->values();
        $skipExisting = (bool) ($payload['skip_existing'] ?? true);
        $created = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $weekday = (int) $date->dayOfWeekIso;

            if (!in_array($weekday, $days, true)) {
                continue;
            }

            foreach ($pegawaiIds as $pegawaiId) {
                $exists = JadwalShiftEntity::query()
                    ->where('pegawai_id', $pegawaiId)
                    ->whereDate('tanggal', $date->toDateString())
                    ->exists();

                if ($exists && $skipExisting) {
                    continue;
                }

                if ($exists && !$skipExisting) {
                    JadwalShiftEntity::query()
                        ->where('pegawai_id', $pegawaiId)
                        ->whereDate('tanggal', $date->toDateString())
                        ->delete();
                }

                JadwalShiftEntity::query()->create([
                    'kode' => $this->generateCode($payload['kode_prefix'] ?? null, $date->toDateString(), $pegawaiId),
                    'pegawai_id' => $pegawaiId,
                    'shift_id' => (int) $payload['shift_id'],
                    'tanggal' => $date->toDateString(),
                    'status' => $payload['status'] ?? 'published',
                    'sumber_jadwal' => 'generate',
                    'catatan' => $payload['catatan'] ?? null,
                    'is_active' => true,
                ]);

                $created++;
            }
        }

        return $created;
    }

    private function normalizePayload(array $payload, bool $isGenerate): array
    {
        return [
            'kode' => $payload['kode'] ?? null,
            'pegawai_id' => $payload['pegawai_id'] ?? null,
            'shift_id' => $payload['shift_id'] ?? null,
            'tanggal' => $payload['tanggal'],
            'status' => $payload['status'] ?? 'published',
            'sumber_jadwal' => $isGenerate ? 'generate' : ($payload['sumber_jadwal'] ?? 'manual'),
            'catatan' => $payload['catatan'] ?? null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
        ];
    }

    private function normalizeWeekdays(array $days): array
    {
        $allowed = [1, 2, 3, 4, 5, 6, 7];

        return collect($days)
            ->map(fn ($day) => (int) $day)
            ->filter(fn ($day) => in_array($day, $allowed, true))
            ->unique()
            ->values()
            ->all();
    }

    private function generateCode(?string $prefix, string $date, int $pegawaiId): string
    {
        $safePrefix = trim((string) ($prefix ?: 'JDL'));

        return strtoupper($safePrefix)
            . '-' . str_replace('-', '', $date)
            . '-' . Str::padLeft((string) $pegawaiId, 4, '0');
    }
}
