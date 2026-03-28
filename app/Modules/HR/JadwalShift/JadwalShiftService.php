<?php

namespace App\Modules\HR\JadwalShift;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanShift\PengaturanShiftEntity;
use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class JadwalShiftService
{
    use ReportExportTrait;

    public function paginate(string $search = '', int $perPage = 10, ?string $month = null): LengthAwarePaginator
    {
        return $this->baseQuery($search, $month)
            ->orderByDesc('tanggal')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function exportRows(string $search = '', ?string $month = null): array
    {
        return $this->baseQuery($search, $month)
            ->orderByDesc('tanggal')
            ->orderBy('id')
            ->get()
            ->map(fn (JadwalShiftEntity $item) => JadwalShiftCollection::toItem($item))
            ->values()
            ->all();
    }

    public function monthlyCalendar(string $month, string $search = ''): array
    {
        [$start, $end, $normalizedMonth] = $this->resolveMonthRange($month);

        $itemsByDate = $this->baseQuery($search, $normalizedMonth)
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get()
            ->map(fn (JadwalShiftEntity $item) => JadwalShiftCollection::toItem($item))
            ->groupBy('tanggal')
            ->map(fn ($group) => $group->values()->all())
            ->all();

        return [
            'month' => $normalizedMonth,
            'month_label' => $start->isoFormat('MMMM YYYY'),
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'items_by_date' => $itemsByDate,
            'total_items' => collect($itemsByDate)->sum(fn ($items) => count($items)),
        ];
    }

    public function monthlyMatrix(string $month, string $search = ''): array
    {
        [$start, $end, $normalizedMonth] = $this->resolveMonthRange($month);

        $matrix = $this->buildMatrixBetween($start, $end, $search);
        $matrix['month'] = $normalizedMonth;
        $matrix['month_label'] = $start->isoFormat('MMMM YYYY');

        return $matrix;
    }

    public function matrixByRange(?string $dateFrom, ?string $dateTo, string $search = ''): array
    {
        [$start, $end] = $this->resolveDateRange($dateFrom, $dateTo);

        $matrix = $this->buildMatrixBetween($start, $end, $search);
        $matrix['month'] = $start->format('Y-m');
        $matrix['month_label'] = $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY');

        return $matrix;
    }

    public function buildExportFiltersForRange(?string $dateFrom, ?string $dateTo): array
    {
        [$start, $end] = $this->resolveDateRange($dateFrom, $dateTo);

        return [
            'period_type' => 'custom',
            'reference_date' => $start->toDateString(),
            'effective_range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY'),
            ],
        ];
    }

    public function buildExportFiltersForMonth(string $month): array
    {
        [$start, $end, $normalizedMonth] = $this->resolveMonthRange($month);

        return [
            'period_type' => 'custom',
            'reference_date' => $normalizedMonth . '-01',
            'effective_range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY'),
            ],
        ];
    }

    private function buildMatrixBetween(Carbon $start, Carbon $end, string $search = ''): array
    {
        $jadwal = JadwalShiftEntity::query()
            ->with([
                'pegawai:id,nama,jabatan',
                'shift:id,nama,jam_masuk,jam_keluar',
            ])
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('pegawai', function ($pegawaiQuery) use ($search) {
                    $pegawaiQuery->where('nama', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get();

        $pegawai = $jadwal
            ->map(fn (JadwalShiftEntity $item) => $item->pegawai)
            ->filter(fn ($item) => $item && $item->id)
            ->unique(fn ($item) => $item->id)
            ->sortBy('nama')
            ->values();

        $jadwalByPegawaiTanggal = $jadwal
            ->groupBy(fn (JadwalShiftEntity $item) => $item->pegawai_id . '#' . optional($item->tanggal)?->toDateString())
            ->map(fn ($group) => $group->first());

        $palette = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#E0E7FF', '#FEE2E2', '#E2E8F0', '#CCFBF1', '#F5D0FE', '#CFFAFE'];
        $shiftLegends = [];
        $shiftMap = [];
        $shiftIndex = 0;

        foreach ($jadwal as $item) {
            if ($item->status === 'libur') {
                continue;
            }

            $shift = $item->shift;

            if (!$shift || !$shift->id || isset($shiftMap[$shift->id])) {
                continue;
            }

            $code = 'S' . ($shiftIndex + 1);
            $color = $palette[$shiftIndex % count($palette)];
            $shiftIndex++;

            $timeLabel = trim(((string) $shift->jam_masuk) . ' - ' . ((string) $shift->jam_keluar), ' -');

            $shiftMap[$shift->id] = [
                'code' => $code,
                'color' => $color,
                'name' => (string) ($shift->nama ?? '-'),
                'time' => $timeLabel !== '' ? $timeLabel : '-',
            ];

            $shiftLegends[] = [
                'code' => $code,
                'color' => $color,
                'label' => (string) ($shift->nama ?? '-'),
                'description' => $timeLabel !== '' ? $timeLabel : '-',
            ];
        }

        $hasLibur = $jadwal->contains(fn (JadwalShiftEntity $item) => $item->status === 'libur');

        if ($hasLibur) {
            $shiftLegends[] = [
                'code' => 'L',
                'color' => '#E5E7EB',
                'label' => 'Libur',
                'description' => '-',
            ];
        }

        $days = [];
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $days[] = [
                'date' => $date->toDateString(),
                'day' => (int) $date->format('j'),
                'weekday_short' => $date->isoFormat('ddd'),
            ];
        }

        $rows = $pegawai->map(function ($item, $index) use ($days, $jadwalByPegawaiTanggal, $shiftMap) {
            $cells = [];

            foreach ($days as $day) {
                $key = $item->id . '#' . $day['date'];
                /** @var JadwalShiftEntity|null $jadwal */
                $jadwal = $jadwalByPegawaiTanggal->get($key);

                if (!$jadwal) {
                    $cells[] = ['code' => '', 'color' => '#FFFFFF'];
                    continue;
                }

                if ($jadwal->status === 'libur') {
                    $cells[] = ['code' => 'L', 'color' => '#E5E7EB'];
                    continue;
                }

                $shiftMeta = $jadwal->shift && isset($shiftMap[$jadwal->shift->id])
                    ? $shiftMap[$jadwal->shift->id]
                    : ['code' => 'S?', 'color' => '#F1F5F9'];

                $cells[] = [
                    'code' => $shiftMeta['code'],
                    'color' => $shiftMeta['color'],
                ];
            }

            return [
                'no' => $index + 1,
                'pegawai_id' => $item->id,
                'pegawai_nama' => $item->nama,
                'jabatan' => (string) ($item->jabatan ?? '-'),
                'cells' => $cells,
            ];
        })->values()->all();

        return [
            'days' => $days,
            'rows' => $rows,
            'legends' => $shiftLegends,
        ];
    }

    public function buildExportTableHtml(array $rows): string
    {
        $html = '<table><thead><tr>'
            . '<th>No</th>'
            . '<th>Kode</th>'
            . '<th>Pegawai</th>'
            . '<th>Shift</th>'
            . '<th>Jam Shift</th>'
            . '<th>Tanggal</th>'
            . '<th>Status</th>'
            . '<th>Sumber</th>'
            . '<th>Catatan</th>'
            . '</tr></thead><tbody>';

        if (empty($rows)) {
            $html .= '<tr><td colspan="9" style="text-align:center;">Tidak ada data jadwal shift.</td></tr>';
        } else {
            foreach ($rows as $index => $item) {
                $jamMasuk = (string) ($item['shift_jam_masuk'] ?? '-');
                $jamKeluar = (string) ($item['shift_jam_keluar'] ?? '-');
                $jamShift = trim($jamMasuk . ' - ' . $jamKeluar, ' -');

                $html .= '<tr>'
                    . '<td>' . ($index + 1) . '</td>'
                    . '<td>' . e((string) ($item['kode'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($item['pegawai_nama'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($item['shift_nama'] ?? '-')) . '</td>'
                    . '<td>' . e($jamShift !== '' ? $jamShift : '-') . '</td>'
                    . '<td>' . e((string) ($item['tanggal'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($item['status'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($item['sumber_jadwal'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($item['catatan'] ?? '-')) . '</td>'
                    . '</tr>';
            }
        }

        $html .= '</tbody></table>';

        return $html;
    }

    public function buildExportMatrixHtml(array $matrix): string
    {
        $days = $matrix['days'] ?? [];
        $rows = $matrix['rows'] ?? [];
        $legends = $matrix['legends'] ?? [];

        $html = '<style>
            .shift-matrix { table-layout: fixed; width: 100%; }
            .shift-matrix th, .shift-matrix td { font-size: 8.5pt; padding: 3px; }
            .shift-matrix .cell-code { text-align: center; font-weight: 700; }
            .shift-matrix .sticky-head { background-color: #e2e8f0; }
            .legend-table th, .legend-table td { font-size: 9pt; padding: 4px; }
        </style>';

        $html .= '<div class="section-title">Monthly Employee Shift Schedule</div>';
        $html .= '<table class="shift-matrix"><thead>';
        $html .= '<tr>'
            . '<th rowspan="2" class="sticky-head" style="text-align:center; width:28px;">No</th>'
            . '<th rowspan="2" class="sticky-head" style="width:130px;">Nama Karyawan</th>'
            . '<th rowspan="2" class="sticky-head" style="width:90px;">Jabatan</th>';

        foreach ($days as $day) {
            $html .= '<th class="sticky-head" style="text-align:center; width:24px;">' . (int) ($day['day'] ?? 0) . '</th>';
        }

        $html .= '</tr><tr>';

        foreach ($days as $day) {
            $html .= '<th class="sticky-head" style="text-align:center;">' . e((string) ($day['weekday_short'] ?? '')) . '</th>';
        }

        $html .= '</tr></thead><tbody>';

        if (empty($rows)) {
            $html .= '<tr><td colspan="' . (count($days) + 3) . '" style="text-align:center;">Tidak ada data jadwal pada periode ini.</td></tr>';
        } else {
            foreach ($rows as $row) {
                $html .= '<tr>'
                    . '<td style="text-align:center;">' . (int) ($row['no'] ?? 0) . '</td>'
                    . '<td>' . e((string) ($row['pegawai_nama'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($row['jabatan'] ?? '-')) . '</td>';

                foreach (($row['cells'] ?? []) as $cell) {
                    $color = (string) ($cell['color'] ?? '#FFFFFF');
                    $code = (string) ($cell['code'] ?? '');
                    $html .= '<td class="cell-code" style="background-color:' . e($color) . ';">' . e($code) . '</td>';
                }

                $html .= '</tr>';
            }
        }

        $html .= '</tbody></table>';

        $html .= '<div class="section-title">Keterangan</div>';
        $html .= '<table class="legend-table"><thead><tr><th style="width:80px; text-align:center;">Kode</th><th style="width:140px;">Warna</th><th>Shift</th><th>Jam</th></tr></thead><tbody>';

        if (empty($legends)) {
            $html .= '<tr><td colspan="4" style="text-align:center;">Belum ada legenda shift.</td></tr>';
        } else {
            foreach ($legends as $legend) {
                $html .= '<tr>'
                    . '<td style="text-align:center; font-weight:600;">' . e((string) ($legend['code'] ?? '-')) . '</td>'
                    . '<td style="background-color:' . e((string) ($legend['color'] ?? '#FFFFFF')) . ';">&nbsp;</td>'
                    . '<td>' . e((string) ($legend['label'] ?? '-')) . '</td>'
                    . '<td>' . e((string) ($legend['description'] ?? '-')) . '</td>'
                    . '</tr>';
            }
        }

        $html .= '</tbody></table>';

        return $html;
    }

    private function baseQuery(string $search = '', ?string $month = null)
    {
        return JadwalShiftEntity::query()
            ->with([
                'pegawai:id,nama',
                'shift:id,nama,jam_masuk,jam_keluar',
            ])
            ->when(is_string($month) && trim($month) !== '', function ($query) use ($month) {
                [$start, $end] = $this->resolveMonthRange($month);
                $query->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()]);
            })
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
            });
    }

    private function resolveMonthRange(string $month): array
    {
        $normalized = trim($month);

        try {
            $start = Carbon::createFromFormat('Y-m', $normalized)->startOfMonth();
        } catch (\Throwable) {
            $start = now()->startOfMonth();
        }

        return [$start, $start->copy()->endOfMonth(), $start->format('Y-m')];
    }

    private function resolveDateRange(?string $dateFrom, ?string $dateTo): array
    {
        $from = is_string($dateFrom) ? trim($dateFrom) : '';
        $to = is_string($dateTo) ? trim($dateTo) : '';

        try {
            $start = $from !== '' ? Carbon::parse($from)->startOfDay() : now()->startOfMonth();
        } catch (\Throwable) {
            $start = now()->startOfMonth();
        }

        try {
            $end = $to !== '' ? Carbon::parse($to)->endOfDay() : now()->endOfMonth();
        } catch (\Throwable) {
            $end = now()->endOfMonth();
        }

        if ($start->gt($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end];
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
        $pegawaiByJabatan = $this->buildPegawaiGroupByJabatan($pegawaiIds);
        $shiftIds = $this->getActiveShiftIds();

        if ($pegawaiByJabatan->isEmpty() || empty($shiftIds) || empty($days)) {
            return 0;
        }

        $skipExisting = (bool) ($payload['skip_existing'] ?? true);
        $created = 0;
        $dayOffset = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $weekday = (int) $date->dayOfWeekIso;

            if (!in_array($weekday, $days, true)) {
                continue;
            }

            foreach ($pegawaiByJabatan as $pegawaiInJabatan) {
                foreach ($pegawaiInJabatan->values() as $index => $pegawaiId) {
                    $pegawaiId = (int) $pegawaiId;
                    // Rotate shift per employee each day so one person is not locked to one shift.
                    $shiftId = (int) $shiftIds[($index + $dayOffset) % count($shiftIds)];

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
                        'shift_id' => $shiftId,
                        'tanggal' => $date->toDateString(),
                        'status' => $payload['status'] ?? 'published',
                        'sumber_jadwal' => 'generate',
                        'catatan' => $payload['catatan'] ?? null,
                        'is_active' => true,
                    ]);

                    $created++;
                }
            }

            $dayOffset++;
        }

        return $created;
    }

    private function buildPegawaiGroupByJabatan(Collection $pegawaiIds): Collection
    {
        return DataPegawaiEntity::query()
            ->select(['id', 'jabatan'])
            ->whereIn('id', $pegawaiIds->all())
            ->where('is_active', true)
            ->orderBy('jabatan')
            ->orderBy('nama')
            ->get()
            ->groupBy(fn ($item) => trim((string) ($item->jabatan ?: 'Tanpa Jabatan')))
            ->map(fn ($group) => $group->pluck('id')->values());
    }

    private function getActiveShiftIds(): array
    {
        return PengaturanShiftEntity::query()
            ->select(['id'])
            ->where('is_active', true)
            ->orderBy('jam_masuk')
            ->orderBy('nama')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
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
