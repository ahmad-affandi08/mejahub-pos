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

    private const SHIFT_SLOT_KEYS = ['PAGI', 'SIANG', 'SORE'];

    private const SHIFT_CODE_ALIASES_BY_SLOT = [
        'PAGI' => ['P1', 'PAGI'],
        'SIANG' => ['S3', 'M1', 'SIANG', 'MIDDLE'],
        'SORE' => ['S1', 'S2', 'SORE', 'CLOSING', 'TUTUP'],
    ];

    private const ROLES_WITH_OFF_PLAN = ['waiters', 'kitchen', 'barista', 'dishwasher'];

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
                'shift:id,kode,nama,jam_masuk,jam_keluar',
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
        $shiftCodeColorMap = [];
        $shiftIndex = 0;

        foreach ($jadwal as $item) {
            if ($item->status === 'libur') {
                continue;
            }

            $shift = $item->shift;

            if (!$shift || !$shift->id || isset($shiftMap[$shift->id])) {
                continue;
            }

            $code = strtoupper(trim((string) ($shift->kode ?? '')));
            if ($code === '') {
                $code = 'SHIFT-' . (string) $shift->id;
            }

            if (!isset($shiftCodeColorMap[$code])) {
                $shiftCodeColorMap[$code] = $palette[$shiftIndex % count($palette)];
                $shiftIndex++;
            }

            $color = $shiftCodeColorMap[$code];

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
                'shift:id,kode,nama,jam_masuk,jam_keluar',
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
            'shift:id,kode,nama,jam_masuk,jam_keluar',
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
        $shiftSlots = $this->getShiftSlotMap();
        $useFormula = (bool) ($payload['use_formula'] ?? true);
        $generateLibur = (bool) ($payload['generate_libur'] ?? true);

        if ($pegawaiByJabatan->isEmpty() || empty($shiftSlots) || empty($days)) {
            return 0;
        }

        $workingDates = [];
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array((int) $date->dayOfWeekIso, $days, true)) {
                $workingDates[] = $date->toDateString();
            }
        }

        if ($workingDates === []) {
            return 0;
        }

        $targetOffCount = intdiv(count($workingDates), 7);
        $weekdayIndexes = $this->weekdayIndexesFromWorkingDates($workingDates);
        $offPlanByPegawai = $this->buildOffPlanByPegawai(
            $pegawaiByJabatan,
            count($workingDates),
            $targetOffCount,
            $weekdayIndexes
        );

        $skipExisting = (bool) ($payload['skip_existing'] ?? true);
        $created = 0;

        foreach ($workingDates as $dayOffset => $dateString) {

            $assignments = $useFormula
                ? $this->buildFormulaAssignments($pegawaiByJabatan, $shiftSlots, (int) $dayOffset, $offPlanByPegawai)
                : $this->buildRoundRobinAssignments($pegawaiByJabatan, $shiftSlots, (int) $dayOffset);

            foreach ($pegawaiByJabatan as $pegawaiInJabatan) {
                $pegawaiInJabatan = $pegawaiInJabatan->map(fn ($id) => (int) $id)->values();

                foreach ($pegawaiInJabatan as $pegawaiId) {
                    $pegawaiId = (int) $pegawaiId;

                    $exists = JadwalShiftEntity::query()
                        ->where('pegawai_id', $pegawaiId)
                        ->whereDate('tanggal', $dateString)
                        ->exists();

                    if ($exists && $skipExisting) {
                        continue;
                    }

                    if ($exists && !$skipExisting) {
                        JadwalShiftEntity::query()
                            ->where('pegawai_id', $pegawaiId)
                            ->whereDate('tanggal', $dateString)
                            ->delete();
                    }

                    $shiftId = $assignments[$pegawaiId] ?? null;
                    $isLibur = $shiftId === null;

                    if ($isLibur && !$generateLibur) {
                        continue;
                    }

                    JadwalShiftEntity::query()->create([
                        'kode' => $this->generateCode($payload['kode_prefix'] ?? null, $dateString, $pegawaiId),
                        'pegawai_id' => $pegawaiId,
                        'shift_id' => $shiftId,
                        'tanggal' => $dateString,
                        'status' => $isLibur ? 'libur' : ($payload['status'] ?? 'published'),
                        'sumber_jadwal' => 'generate',
                        'catatan' => $payload['catatan'] ?? null,
                        'is_active' => true,
                    ]);

                    $created++;
                }
            }
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
            ->groupBy(fn ($item) => $this->normalizeJabatanKey((string) ($item->jabatan ?: 'Tanpa Jabatan')))
            ->map(fn ($group) => $group->pluck('id')->values());
    }

    private function getShiftSlotMap(): array
    {
        $rows = PengaturanShiftEntity::query()
            ->select(['id', 'kode', 'nama', 'jam_masuk', 'jam_keluar'])
            ->where('is_active', true)
            ->orderBy('jam_masuk')
            ->orderBy('nama')
            ->get();

        $slots = [
            'PAGI' => null,
            'SIANG' => null,
            'SORE' => null,
        ];

        $orderedIds = [];

        foreach ($rows as $row) {
            $shiftId = (int) $row->id;
            $orderedIds[] = $shiftId;

            $code = strtoupper(trim((string) ($row->kode ?? '')));
            $name = strtolower(trim((string) ($row->nama ?? '')));

            if ($slots['PAGI'] === null && (in_array($code, self::SHIFT_CODE_ALIASES_BY_SLOT['PAGI'], true) || str_contains($name, 'pagi'))) {
                $slots['PAGI'] = $shiftId;
                continue;
            }

            if ($slots['SIANG'] === null && (in_array($code, self::SHIFT_CODE_ALIASES_BY_SLOT['SIANG'], true) || str_contains($name, 'siang') || str_contains($name, 'middle'))) {
                $slots['SIANG'] = $shiftId;
                continue;
            }

            if ($slots['SORE'] === null && (in_array($code, self::SHIFT_CODE_ALIASES_BY_SLOT['SORE'], true) || str_contains($name, 'sore') || str_contains($name, 'tutup') || str_contains($name, 'closing'))) {
                $slots['SORE'] = $shiftId;
            }
        }

        if ($orderedIds !== []) {
            if ($slots['PAGI'] === null) {
                $slots['PAGI'] = (int) $orderedIds[0];
            }

            if ($slots['SORE'] === null) {
                $slots['SORE'] = (int) $orderedIds[count($orderedIds) - 1];
            }

            if ($slots['SIANG'] === null) {
                $middleIndex = (int) floor((count($orderedIds) - 1) / 2);
                $slots['SIANG'] = (int) $orderedIds[$middleIndex];
            }
        }

        return collect($slots)
            ->filter(fn ($id) => $id !== null)
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function buildOffPlanByPegawai(Collection $pegawaiByJabatan, int $totalDays, int $targetOffCount, array $allowedIndexes): array
    {
        if ($totalDays < 3 || $targetOffCount <= 0 || $allowedIndexes === []) {
            return [];
        }

        $plan = [];

        foreach ($pegawaiByJabatan as $jabatanKey => $pegawaiInJabatan) {
            if (!in_array((string) $jabatanKey, self::ROLES_WITH_OFF_PLAN, true)) {
                continue;
            }

            $pegawaiInJabatan = $pegawaiInJabatan->map(fn ($id) => (int) $id)->values();

            // Barista khusus: jika total 2 orang, jadwal libur diselang agar tidak bentrok.
            if ((string) $jabatanKey === 'barista' && $pegawaiInJabatan->count() === 2) {
                $firstPegawaiId = (int) $pegawaiInJabatan->get(0);
                $secondPegawaiId = (int) $pegawaiInJabatan->get(1);

                $firstOff = $this->buildFixedOffIndexes($totalDays, $targetOffCount, 3, $allowedIndexes);
                $secondOff = $this->buildFixedOffIndexes($totalDays, $targetOffCount, 6, $allowedIndexes);

                $plan[$firstPegawaiId] = $firstOff;
                $plan[$secondPegawaiId] = $secondOff;
                continue;
            }

            foreach ($pegawaiInJabatan as $position => $pegawaiId) {
                $pegawaiId = (int) $pegawaiId;
                $safeOffCount = min($targetOffCount, max(0, $totalDays - 2));

                if ($safeOffCount <= 0) {
                    continue;
                }

                $step = max(1, intdiv($totalDays, $safeOffCount + 1));
                $offset = $position % $step;
                $offIndexes = $this->buildFixedOffIndexes($totalDays, $safeOffCount, $offset + $step, $allowedIndexes);

                $plan[$pegawaiId] = array_values(array_unique($offIndexes));
            }
        }

        return $plan;
    }

    private function buildFixedOffIndexes(int $totalDays, int $offCount, int $startIndex, array $allowedIndexes): array
    {
        $allowedIndexes = array_values(array_unique(array_filter(
            $allowedIndexes,
            fn ($idx) => is_int($idx) && $idx >= 1 && $idx <= ($totalDays - 2)
        )));

        if ($allowedIndexes === []) {
            return [];
        }

        $safeOffCount = min($offCount, count($allowedIndexes));
        if ($safeOffCount <= 0) {
            return [];
        }

        $step = max(1, intdiv($totalDays, $safeOffCount + 1));
        $indexes = [];

        for ($i = 0; $i < $safeOffCount; $i++) {
            $candidate = $startIndex + ($i * $step);
            $candidate = max(1, min($totalDays - 2, $candidate));

            $candidate = $this->nearestAllowedIndex($candidate, $allowedIndexes, $indexes);
            if ($candidate === null) {
                break;
            }

            $indexes[] = $candidate;
        }

        return array_values(array_unique($indexes));
    }

    private function weekdayIndexesFromWorkingDates(array $workingDates): array
    {
        $indexes = [];

        foreach ($workingDates as $index => $dateString) {
            try {
                $isoDay = (int) Carbon::parse($dateString)->dayOfWeekIso;
            } catch (\Throwable) {
                continue;
            }

            if (in_array($isoDay, [6, 7], true)) {
                continue;
            }

            $indexes[] = (int) $index;
        }

        return $indexes;
    }

    private function nearestAllowedIndex(int $target, array $allowedIndexes, array $usedIndexes): ?int
    {
        $available = array_values(array_filter(
            $allowedIndexes,
            fn ($idx) => !in_array($idx, $usedIndexes, true)
        ));

        if ($available === []) {
            return null;
        }

        usort($available, function ($a, $b) use ($target) {
            $distanceA = abs($a - $target);
            $distanceB = abs($b - $target);

            if ($distanceA === $distanceB) {
                return $a <=> $b;
            }

            return $distanceA <=> $distanceB;
        });

        return (int) $available[0];
    }

    private function buildRoundRobinAssignments(Collection $pegawaiByJabatan, array $shiftSlots, int $dayOffset): array
    {
        $assignments = [];
        $shiftIds = collect(self::SHIFT_SLOT_KEYS)
            ->map(fn ($slot) => $shiftSlots[$slot] ?? null)
            ->filter(fn ($id) => $id !== null)
            ->values()->all();

        if ($shiftIds === []) {
            return $assignments;
        }

        foreach ($pegawaiByJabatan as $pegawaiInJabatan) {
            $pegawaiInJabatan = $pegawaiInJabatan->map(fn ($id) => (int) $id)->values();

            foreach ($pegawaiInJabatan as $index => $pegawaiId) {
                $assignments[(int) $pegawaiId] = (int) $shiftIds[($index + $dayOffset) % count($shiftIds)];
            }
        }

        return $assignments;
    }

    private function buildFormulaAssignments(Collection $pegawaiByJabatan, array $shiftSlots, int $dayOffset, array $offPlanByPegawai): array
    {
        $assignments = [];

        foreach ($pegawaiByJabatan as $jabatanKey => $pegawaiInJabatan) {
            $pegawaiInJabatan = $pegawaiInJabatan->map(fn ($id) => (int) $id)->values();

            if ($pegawaiInJabatan->isEmpty()) {
                continue;
            }

            foreach ($pegawaiInJabatan as $position => $pegawaiId) {
                $pegawaiId = (int) $pegawaiId;
                $offIndexes = $offPlanByPegawai[$pegawaiId] ?? [];

                if (in_array($dayOffset, $offIndexes, true)) {
                    $assignments[$pegawaiId] = null;
                    continue;
                }

                $preferredSlot = $this->preferredSlotByRole(
                    (string) $jabatanKey,
                    (int) $position,
                    $dayOffset,
                    $offIndexes
                );

                $slot = $preferredSlot ?? $this->defaultSlotByRole((string) $jabatanKey, (int) $position, $dayOffset);
                $assignments[$pegawaiId] = $shiftSlots[$slot] ?? $this->firstAvailableShiftId($shiftSlots);
            }
        }

        return $assignments;
    }

    private function rotatePegawai(Collection $pegawaiIds, int $dayOffset): array
    {
        $values = $pegawaiIds->values()->all();
        $total = count($values);

        if ($total <= 1) {
            return $values;
        }

        $start = $dayOffset % $total;

        return array_merge(
            array_slice($values, $start),
            array_slice($values, 0, $start)
        );
    }

    private function preferredSlotByRole(string $jabatanKey, int $position, int $dayOffset, array $offIndexes): ?string
    {
        $isDayBeforeOff = in_array($dayOffset + 1, $offIndexes, true);
        $isDayAfterOff = in_array($dayOffset - 1, $offIndexes, true);

        if (in_array($jabatanKey, ['waiters', 'kitchen'], true)) {
            if ($isDayBeforeOff) {
                return 'PAGI';
            }

            if ($isDayAfterOff) {
                return 'SIANG';
            }

            return null;
        }

        if ($jabatanKey === 'barista') {
            if ($isDayBeforeOff) {
                return 'SORE';
            }

            if ($isDayAfterOff) {
                return 'PAGI';
            }

            return null;
        }

        return null;
    }

    private function defaultSlotByRole(string $jabatanKey, int $position, int $dayOffset): string
    {
        $phase = ($position + $dayOffset) % 2;

        if (in_array($jabatanKey, ['waiters', 'kitchen'], true)) {
            return $phase === 0 ? 'PAGI' : 'SIANG';
        }

        if ($jabatanKey === 'barista') {
            return $phase === 0 ? 'SIANG' : 'SORE';
        }

        if ($jabatanKey === 'kasir') {
            return $phase === 0 ? 'PAGI' : 'SORE';
        }

        if ($jabatanKey === 'dishwasher') {
            return match (($position + $dayOffset) % 3) {
                0 => 'PAGI',
                1 => 'SIANG',
                default => 'SORE',
            };
        }

        return 'PAGI';
    }

    private function firstAvailableShiftId(array $shiftSlots): ?int
    {
        foreach (self::SHIFT_SLOT_KEYS as $slot) {
            if (isset($shiftSlots[$slot])) {
                return (int) $shiftSlots[$slot];
            }
        }

        return null;
    }

    private function normalizeJabatanKey(string $jabatan): string
    {
        $value = strtolower(trim($jabatan));

        if (str_contains($value, 'waiter')) {
            return 'waiters';
        }

        if (str_contains($value, 'kitchen') || str_contains($value, 'cook') || str_contains($value, 'chef')) {
            return 'kitchen';
        }

        if (str_contains($value, 'barista')) {
            return 'barista';
        }

        if (str_contains($value, 'kasir') || str_contains($value, 'cashier')) {
            return 'kasir';
        }

        if (str_contains($value, 'dishwasher') || str_contains($value, 'dish washer')) {
            return 'dishwasher';
        }

        return $value !== '' ? $value : 'tanpa-jabatan';
    }

    private function normalizePayload(array $payload, bool $isGenerate): array
    {
        $kode = $payload['kode'] ?? null;

        if (empty($kode) && !empty($payload['tanggal']) && !empty($payload['pegawai_id'])) {
            $kode = $this->generateCode(null, $payload['tanggal'], (int) $payload['pegawai_id']);
        }

        return [
            'kode' => $kode,
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
