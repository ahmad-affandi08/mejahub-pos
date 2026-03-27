<?php

namespace App\Modules\Dashboard\Overview;

use App\Models\User;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\Report\LaporanHeatmap\LaporanHeatmapService;
use App\Modules\Report\LaporanHutang\LaporanHutangService;
use App\Modules\Report\LaporanKeuangan\LaporanKeuanganService;
use App\Modules\Report\LaporanOpnameSelisih\LaporanOpnameSelisihService;
use App\Modules\Report\LaporanPajak\LaporanPajakService;
use App\Modules\Report\LaporanPenjualan\LaporanPenjualanService;
use App\Modules\Report\LaporanPerformaMenu\LaporanPerformaMenuService;
use App\Modules\Report\LaporanPettyCash\LaporanPettyCashService;
use App\Modules\Report\LaporanShift\LaporanShiftService;
use App\Modules\Report\LaporanStok\LaporanStokService;
use App\Modules\Report\LaporanVoidRefund\LaporanVoidRefundService;
use App\Modules\Report\LaporanWaste\LaporanWasteService;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Support\ReportExportTrait;
use Carbon\Carbon;

class OverviewService
{
    use ReportExportTrait;

    public function __construct(
        private readonly LaporanPenjualanService $laporanPenjualanService,
        private readonly LaporanKeuanganService $laporanKeuanganService,
        private readonly LaporanPerformaMenuService $laporanPerformaMenuService,
        private readonly LaporanPettyCashService $laporanPettyCashService,
        private readonly LaporanWasteService $laporanWasteService,
        private readonly LaporanVoidRefundService $laporanVoidRefundService,
        private readonly LaporanOpnameSelisihService $laporanOpnameSelisihService,
        private readonly LaporanHeatmapService $laporanHeatmapService,
        private readonly LaporanStokService $laporanStokService,
        private readonly LaporanHutangService $laporanHutangService,
        private readonly LaporanShiftService $laporanShiftService,
        private readonly LaporanPajakService $laporanPajakService,
    ) {
    }

    public function buildDashboard(
        string $periodType = 'daily',
        string $referenceDate = '',
        ?string $dateFrom = null,
        ?string $dateTo = null,
        int $topLimit = 10,
    ): array
    {
        [$start, $end] = $this->resolveRange($periodType, $referenceDate, $dateFrom, $dateTo);
        [$prevStart, $prevEnd] = $this->previousRange($start, $end);

        $masterSummary = [
            'total_user' => User::query()->count(),
            'total_pegawai' => DataPegawaiEntity::query()->count(),
            'total_kategori_menu' => KategoriMenuEntity::query()->count(),
            'total_data_menu' => DataMenuEntity::query()->count(),
        ];

        $penjualan = $this->laporanPenjualanService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo, $topLimit);
        $keuangan = $this->laporanKeuanganService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $performaMenu = $this->laporanPerformaMenuService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo, $topLimit);
        $pettyCash = $this->laporanPettyCashService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $waste = $this->laporanWasteService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $voidRefund = $this->laporanVoidRefundService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $opnameSelisih = $this->laporanOpnameSelisihService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $heatmap = $this->laporanHeatmapService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo);
        $stok = $this->laporanStokService->buildDashboard('', 10, true);
        $hutang = $this->laporanHutangService->buildDashboard();
        $shift = $this->laporanShiftService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo, 10);
        $pajak = $this->laporanPajakService->buildDashboard($periodType, $referenceDate, $dateFrom, $dateTo, 10);

        $prevDateFrom = $prevStart->toDateString();
        $prevDateTo = $prevEnd->toDateString();

        $previousPenjualan = $this->laporanPenjualanService->buildDashboard('custom', $prevDateFrom, $prevDateFrom, $prevDateTo, $topLimit);
        $previousKeuangan = $this->laporanKeuanganService->buildDashboard('custom', $prevDateFrom, $prevDateFrom, $prevDateTo);
        $previousVoidRefund = $this->laporanVoidRefundService->buildDashboard('custom', $prevDateFrom, $prevDateFrom, $prevDateTo);
        $previousWaste = $this->laporanWasteService->buildDashboard('custom', $prevDateFrom, $prevDateFrom, $prevDateTo);

        return [
            'filters' => [
                'period_type' => $penjualan['filters']['period_type'] ?? 'daily',
                'reference_date' => $penjualan['filters']['reference_date'] ?? now()->toDateString(),
                'date_from' => $penjualan['filters']['date_from'] ?? null,
                'date_to' => $penjualan['filters']['date_to'] ?? null,
                'top_limit' => $topLimit,
                'effective_range' => $penjualan['filters']['effective_range'] ?? null,
                'previous_range' => [
                    'start' => $prevDateFrom,
                    'end' => $prevDateTo,
                    'label' => $prevStart->isoFormat('DD MMM YYYY') . ' - ' . $prevEnd->isoFormat('DD MMM YYYY'),
                ],
            ],
            'master_summary' => $masterSummary,
            'penjualan' => $penjualan,
            'keuangan' => $keuangan,
            'performa_menu' => $performaMenu,
            'petty_cash' => $pettyCash,
            'waste' => $waste,
            'void_refund' => $voidRefund,
            'opname_selisih' => $opnameSelisih,
            'heatmap' => $heatmap,
            'stok' => [
                'summary' => $stok['summary'] ?? [],
                'low_stocks' => collect($stok['low_stocks'] ?? [])->take(8)->values()->all(),
            ],
            'hutang' => [
                'summary' => $hutang['summary'] ?? [],
                'aging' => $hutang['aging'] ?? [],
                'per_supplier' => collect($hutang['per_supplier'] ?? [])->take(6)->values()->all(),
                'recent_due' => collect($hutang['recent_due'] ?? [])->take(6)->values()->all(),
            ],
            'shift' => $shift,
            'pajak' => $pajak,
            'kpi_comparison' => [
                'omzet' => $this->buildComparison(
                    (float) ($penjualan['summary']['omzet'] ?? 0),
                    (float) ($previousPenjualan['summary']['omzet'] ?? 0),
                ),
                'net_income' => $this->buildComparison(
                    (float) ($keuangan['summary']['net_income'] ?? 0),
                    (float) ($previousKeuangan['summary']['net_income'] ?? 0),
                ),
                'refund_nominal' => $this->buildComparison(
                    (float) ($voidRefund['summary']['total_refund_nominal'] ?? 0),
                    (float) ($previousVoidRefund['summary']['total_refund_nominal'] ?? 0),
                ),
                'waste_nilai' => $this->buildComparison(
                    (float) ($waste['summary']['total_nilai_kerugian'] ?? 0),
                    (float) ($previousWaste['summary']['total_nilai_kerugian'] ?? 0),
                ),
            ],
        ];
    }

    public function buildExportTableHtml(array $overview): string
    {
        $filters = $overview['filters'] ?? [];
        $penjualan = $overview['penjualan'] ?? [];
        $keuangan = $overview['keuangan'] ?? [];
        $voidRefund = $overview['void_refund'] ?? [];
        $waste = $overview['waste'] ?? [];
        $stok = $overview['stok'] ?? [];
        $hutang = $overview['hutang'] ?? [];

        $html = '<div class="section-title">KPI Utama</div><table><tbody>'
            . '<tr><th>Omzet</th><td>' . $this->formatCurrency((float) ($penjualan['summary']['omzet'] ?? 0)) . '</td></tr>'
            . '<tr><th>Net Income</th><td>' . $this->formatCurrency((float) ($keuangan['summary']['net_income'] ?? 0)) . '</td></tr>'
            . '<tr><th>Refund Nominal</th><td>' . $this->formatCurrency((float) ($voidRefund['summary']['total_refund_nominal'] ?? 0)) . '</td></tr>'
            . '<tr><th>Nilai Waste</th><td>' . $this->formatCurrency((float) ($waste['summary']['total_nilai_kerugian'] ?? 0)) . '</td></tr>'
            . '<tr><th>Total Hutang Aktif</th><td>' . $this->formatCurrency((float) ($hutang['summary']['total_hutang'] ?? 0)) . '</td></tr>'
            . '</tbody></table>';

        $topItems = $penjualan['top_items'] ?? [];
        if (!empty($topItems)) {
            $html .= '<div class="section-title">Top Item Terjual</div><table><thead><tr><th>Menu</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Nilai</th></tr></thead><tbody>';
            foreach ($topItems as $item) {
                $html .= '<tr><td>' . e((string) ($item['nama_menu'] ?? '-')) . '</td><td style="text-align:right;">' . (int) ($item['total_qty'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_penjualan'] ?? 0)) . '</td></tr>';
            }
            $html .= '</tbody></table>';
        }

        $lowStocks = $stok['low_stocks'] ?? [];
        if (!empty($lowStocks)) {
            $html .= '<div class="section-title">Low Stock</div><table><thead><tr><th>Bahan</th><th>Satuan</th><th style="text-align:right;">Stok Saat Ini</th><th style="text-align:right;">Minimum</th></tr></thead><tbody>';
            foreach ($lowStocks as $item) {
                $html .= '<tr><td>' . e((string) ($item['nama'] ?? '-')) . '</td><td>' . e((string) ($item['satuan'] ?? '-')) . '</td><td style="text-align:right;">' . (float) ($item['stok_saat_ini'] ?? 0) . '</td><td style="text-align:right;">' . (float) ($item['stok_minimum'] ?? 0) . '</td></tr>';
            }
            $html .= '</tbody></table>';
        }

        return $html;
    }

    private function resolveRange(string $periodType, string $referenceDate, ?string $dateFrom, ?string $dateTo): array
    {
        $allowed = ['daily', 'weekly', 'monthly', 'custom'];
        $normalizedType = in_array($periodType, $allowed, true) ? $periodType : 'daily';
        $reference = $this->safeParseDate($referenceDate) ?? now();

        if ($normalizedType === 'custom') {
            $start = $this->safeParseDate($dateFrom) ?? $reference->copy()->startOfMonth();
            $end = $this->safeParseDate($dateTo) ?? $reference->copy()->endOfMonth();
            if ($start->gt($end)) {
                [$start, $end] = [$end, $start];
            }
            return [$start->copy()->startOfDay(), $end->copy()->endOfDay()];
        }

        if ($normalizedType === 'weekly') {
            return [$reference->copy()->startOfWeek(Carbon::MONDAY), $reference->copy()->endOfWeek(Carbon::SUNDAY)];
        }

        if ($normalizedType === 'monthly') {
            return [$reference->copy()->startOfMonth(), $reference->copy()->endOfMonth()];
        }

        return [$reference->copy()->startOfDay(), $reference->copy()->endOfDay()];
    }

    private function previousRange(Carbon $start, Carbon $end): array
    {
        $days = $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;
        $prevEnd = $start->copy()->subDay()->endOfDay();
        $prevStart = $prevEnd->copy()->subDays(max(1, $days) - 1)->startOfDay();

        return [$prevStart, $prevEnd];
    }

    private function safeParseDate(?string $value): ?Carbon
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function buildComparison(float $current, float $previous): array
    {
        $delta = $current - $previous;
        $deltaPercent = $previous != 0.0 ? ($delta / $previous) * 100 : null;

        return [
            'current' => $current,
            'previous' => $previous,
            'delta' => $delta,
            'delta_percent' => $deltaPercent,
        ];
    }
}
