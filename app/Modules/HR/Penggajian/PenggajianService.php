<?php

namespace App\Modules\HR\Penggajian;

use App\Modules\HR\Absensi\AbsensiEntity;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\Penggajian\PenggajianEntity;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PenggajianService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return PenggajianEntity::query()
            ->with('pegawai:id,nama')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('kode', 'like', '%' . $search . '%')
                        ->orWhere('periode', 'like', '%' . $search . '%')
                        ->orWhere('status', 'like', '%' . $search . '%')
                        ->orWhereHas('pegawai', function ($pegawaiQuery) use ($search) {
                            $pegawaiQuery->where('nama', 'like', '%' . $search . '%');
                        });
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): PenggajianEntity
    {
        return PenggajianEntity::query()->create($this->normalizePayload($payload));
    }

    public function update(int $id, array $payload): PenggajianEntity
    {
        $entity = PenggajianEntity::query()->findOrFail($id);
        $entity->update($this->normalizePayload($payload));

        return $entity->refresh()->load('pegawai:id,nama');
    }

    public function delete(int $id): void
    {
        $entity = PenggajianEntity::query()->findOrFail($id);
        $entity->delete();
    }

    public function generateFromAbsensi(array $payload): int
    {
        $periode = (string) $payload['periode'];
        [$startDate, $endDate] = $this->getPeriodRange($periode);
        $hariKerja = $this->normalizeWorkdays($payload['hari_kerja'] ?? [1, 2, 3, 4, 5, 6]);
        $expectedWorkDays = $this->countWorkdaysInRange($startDate, $endDate, $hariKerja);
        $skipExisting = (bool) ($payload['skip_existing'] ?? true);
        $includeTerlambatPenalty = (bool) ($payload['include_terlambat_penalty'] ?? false);
        $gajiPokokDefault = (float) ($payload['gaji_pokok_default'] ?? 0);
        $gajiPokokPerPegawai = $this->normalizeGajiPokokPerPegawai($payload['gaji_pokok_per_pegawai'] ?? []);
        $gajiPokokPerJabatan = $this->normalizeGajiPokokPerJabatan($payload['gaji_pokok_per_jabatan'] ?? []);

        $pegawaiIds = collect($payload['pegawai_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->values();

        $pegawaiQuery = DataPegawaiEntity::query()->where('is_active', true);

        if ($pegawaiIds->isNotEmpty()) {
            $pegawaiQuery->whereIn('id', $pegawaiIds->all());
        }

        $pegawaiList = $pegawaiQuery->orderBy('nama')->get(['id', 'nama', 'jabatan']);
        $createdCount = 0;

        foreach ($pegawaiList as $pegawai) {
            $absensiByDate = AbsensiEntity::query()
                ->where('pegawai_id', $pegawai->id)
                ->whereBetween('tanggal', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('is_active', true)
                ->orderByDesc('id')
                ->get(['tanggal', 'status'])
                ->unique(fn ($item) => optional($item->tanggal)?->toDateString())
                ->values();

            $rekap = $this->buildAttendanceRecap($absensiByDate, $expectedWorkDays);

            $potonganTambahan = (float) ($payload['potongan_per_alpha'] ?? 0) * $rekap['jumlah_alpha'];

            if ($includeTerlambatPenalty) {
                $potonganTambahan += (float) ($payload['potongan_per_terlambat'] ?? 0) * $rekap['jumlah_terlambat'];
            }

            $gajiPokok = $this->resolveGajiPokokPegawai(
                (int) $pegawai->id,
                $pegawai->jabatan,
                $gajiPokokPerPegawai,
                $gajiPokokPerJabatan,
                $gajiPokokDefault,
            );

            $basePayload = [
                'kode' => $this->generateKode($payload['kode_prefix'] ?? null, $periode, (int) $pegawai->id),
                'pegawai_id' => (int) $pegawai->id,
                'periode' => $periode,
                'tanggal_pembayaran' => $payload['tanggal_pembayaran'] ?? null,
                'gaji_pokok' => $gajiPokok,
                'tunjangan' => (float) ($payload['tunjangan_default'] ?? 0),
                'lembur' => (float) ($payload['lembur_default'] ?? 0),
                'bonus' => (float) ($payload['bonus_default'] ?? 0),
                'potongan' => (float) ($payload['potongan_default'] ?? 0) + $potonganTambahan,
                'status' => $payload['status'] ?? 'proses',
                'catatan' => $payload['catatan'] ?? null,
                'is_active' => (bool) ($payload['is_active'] ?? true),
                'jumlah_hadir' => $rekap['jumlah_hadir'],
                'jumlah_izin' => $rekap['jumlah_izin'],
                'jumlah_sakit' => $rekap['jumlah_sakit'],
                'jumlah_cuti' => $rekap['jumlah_cuti'],
                'jumlah_alpha' => $rekap['jumlah_alpha'],
                'jumlah_terlambat' => $rekap['jumlah_terlambat'],
                'generated_from_absensi' => true,
            ];

            $existing = PenggajianEntity::query()
                ->where('pegawai_id', (int) $pegawai->id)
                ->where('periode', $periode)
                ->first();

            if ($existing && $skipExisting) {
                continue;
            }

            if ($existing && !$skipExisting) {
                $existing->update($this->normalizePayload($basePayload));
                $createdCount++;
                continue;
            }

            PenggajianEntity::query()->create($this->normalizePayload($basePayload));
            $createdCount++;
        }

        return $createdCount;
    }

    private function normalizePayload(array $payload): array
    {
        $gajiPokok = (float) ($payload['gaji_pokok'] ?? 0);
        $tunjangan = (float) ($payload['tunjangan'] ?? 0);
        $lembur = (float) ($payload['lembur'] ?? 0);
        $bonus = (float) ($payload['bonus'] ?? 0);
        $potongan = (float) ($payload['potongan'] ?? 0);

        return [
            'kode' => $payload['kode'] ?? null,
            'pegawai_id' => $payload['pegawai_id'] ?? null,
            'periode' => $payload['periode'],
            'tanggal_pembayaran' => $payload['tanggal_pembayaran'] ?? null,
            'gaji_pokok' => $gajiPokok,
            'tunjangan' => $tunjangan,
            'lembur' => $lembur,
            'bonus' => $bonus,
            'potongan' => $potongan,
            'total_gaji' => $gajiPokok + $tunjangan + $lembur + $bonus - $potongan,
            'status' => $payload['status'] ?? 'draft',
            'catatan' => $payload['catatan'] ?? null,
            'jumlah_hadir' => (int) ($payload['jumlah_hadir'] ?? 0),
            'jumlah_izin' => (int) ($payload['jumlah_izin'] ?? 0),
            'jumlah_sakit' => (int) ($payload['jumlah_sakit'] ?? 0),
            'jumlah_cuti' => (int) ($payload['jumlah_cuti'] ?? 0),
            'jumlah_alpha' => (int) ($payload['jumlah_alpha'] ?? 0),
            'jumlah_terlambat' => (int) ($payload['jumlah_terlambat'] ?? 0),
            'generated_from_absensi' => (bool) ($payload['generated_from_absensi'] ?? false),
            'is_active' => (bool) ($payload['is_active'] ?? true),
        ];
    }

    private function getPeriodRange(string $periode): array
    {
        $start = Carbon::createFromFormat('Y-m', $periode)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        return [$start, $end];
    }

    private function normalizeWorkdays(array $days): array
    {
        $allowed = [1, 2, 3, 4, 5, 6, 7];

        $normalized = collect($days)
            ->map(fn ($day) => (int) $day)
            ->filter(fn ($day) => in_array($day, $allowed, true))
            ->unique()
            ->values()
            ->all();

        return empty($normalized) ? [1, 2, 3, 4, 5, 6] : $normalized;
    }

    private function countWorkdaysInRange(Carbon $startDate, Carbon $endDate, array $workdays): int
    {
        $count = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array((int) $date->dayOfWeekIso, $workdays, true)) {
                $count++;
            }
        }

        return $count;
    }

    private function buildAttendanceRecap(Collection $absensiByDate, int $expectedWorkDays): array
    {
        $statusCounter = [
            'hadir' => 0,
            'izin' => 0,
            'sakit' => 0,
            'cuti' => 0,
            'alpha' => 0,
            'terlambat' => 0,
        ];

        foreach ($absensiByDate as $item) {
            $status = strtolower((string) ($item->status ?? ''));

            if (array_key_exists($status, $statusCounter)) {
                $statusCounter[$status]++;
            }
        }

        $recordedDays = array_sum($statusCounter);
        $missingDays = max(0, $expectedWorkDays - $recordedDays);
        $statusCounter['alpha'] += $missingDays;

        return [
            'jumlah_hadir' => $statusCounter['hadir'],
            'jumlah_izin' => $statusCounter['izin'],
            'jumlah_sakit' => $statusCounter['sakit'],
            'jumlah_cuti' => $statusCounter['cuti'],
            'jumlah_alpha' => $statusCounter['alpha'],
            'jumlah_terlambat' => $statusCounter['terlambat'],
        ];
    }

    private function generateKode(?string $prefix, string $periode, int $pegawaiId): string
    {
        $cleanPrefix = trim((string) ($prefix ?: 'GJI'));

        return strtoupper($cleanPrefix)
            . '-' . str_replace('-', '', $periode)
            . '-' . str_pad((string) $pegawaiId, 4, '0', STR_PAD_LEFT);
    }

    private function normalizeGajiPokokPerJabatan(array $map): array
    {
        $normalized = [];

        foreach ($map as $jabatan => $nominal) {
            $key = mb_strtolower(trim((string) $jabatan));

            if ($key === '') {
                continue;
            }

            $normalized[$key] = (float) ($nominal ?? 0);
        }

        return $normalized;
    }

    private function normalizeGajiPokokPerPegawai(array $map): array
    {
        $normalized = [];

        foreach ($map as $pegawaiId => $nominal) {
            $key = (int) $pegawaiId;

            if ($key <= 0) {
                continue;
            }

            $normalized[$key] = (float) ($nominal ?? 0);
        }

        return $normalized;
    }

    private function resolveGajiPokokPegawai(int $pegawaiId, ?string $jabatan, array $pegawaiMap, array $jabatanMap, float $default): float
    {
        if (array_key_exists($pegawaiId, $pegawaiMap)) {
            return (float) $pegawaiMap[$pegawaiId];
        }

        $jabatanKey = mb_strtolower(trim((string) ($jabatan ?? '')));

        if ($jabatanKey !== '' && array_key_exists($jabatanKey, $jabatanMap)) {
            return (float) $jabatanMap[$jabatanKey];
        }

        return $default;
    }
}
