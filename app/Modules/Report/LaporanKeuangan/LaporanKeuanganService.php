<?php

namespace App\Modules\Report\LaporanKeuangan;

use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class LaporanKeuanganService
{
	use ReportExportTrait;

	public function buildDashboard(
		string $periodType = 'daily',
		string $referenceDate = '',
		?string $dateFrom = null,
		?string $dateTo = null,
	): array {
		[$start, $end, $normalizedPeriodType, $normalizedReferenceDate] = $this->resolvePeriodRange($periodType, $referenceDate, $dateFrom, $dateTo);

		$revenue = $this->revenueTotal($start, $end);
		$hpp = $this->hppTotal($start, $end);
		$grossProfit = $revenue - $hpp;
		$marginPersen = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;

		$pajak = $this->pajakTotal($start, $end);
		$serviceCharge = $this->serviceChargeTotal($start, $end);
		$diskon = $this->diskonTotal($start, $end);
		$pengeluaran = $this->pengeluaranTotal($start, $end);
		$pettyCash = $this->pettyCashOutTotal($start, $end);
		$hutang = $this->hutangTotal();

		$expenseBreakdown = $this->expenseBreakdown($start, $end);
		$dailyTrend = $this->dailyTrend($start, $end);

		return [
			'filters' => [
				'period_type' => $normalizedPeriodType,
				'reference_date' => $normalizedReferenceDate,
				'date_from' => $dateFrom,
				'date_to' => $dateTo,
				'effective_range' => [
					'start' => $start->toDateString(),
					'end' => $end->toDateString(),
					'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY'),
				],
			],
			'summary' => [
				'revenue' => round($revenue, 2),
				'hpp' => round($hpp, 2),
				'gross_profit' => round($grossProfit, 2),
				'margin_persen' => round($marginPersen, 2),
				'pajak_terkumpul' => round($pajak, 2),
				'service_charge' => round($serviceCharge, 2),
				'total_diskon' => round($diskon, 2),
				'total_pengeluaran' => round($pengeluaran, 2),
				'petty_cash_keluar' => round($pettyCash, 2),
				'total_hutang_aktif' => round($hutang, 2),
				'net_income' => round($grossProfit - $pengeluaran - $pettyCash, 2),
			],
			'expense_breakdown' => $expenseBreakdown,
			'daily_trend' => $dailyTrend,
		];
	}

	// ─── Revenue ──────────────────────────────────────────────────

	private function revenueTotal(Carbon $start, Carbon $end): float
	{
		return (float) PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->sum('nominal_tagihan');
	}

	// ─── HPP (Cost of Goods Sold via BOM) ─────────────────────────

	private function hppTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('pos_pesanan_item as pi')
			->join('pos_pesanan as p', 'p.id', '=', 'pi.pesanan_id')
			->join('inventory_resep_bom as bom', function ($join) {
				$join->on('bom.data_menu_id', '=', 'pi.data_menu_id')
					->where('bom.is_active', true);
			})
			->join('inventory_bahan_baku as bb', 'bb.id', '=', 'bom.bahan_baku_id')
			->whereNull('pi.deleted_at')
			->whereNull('p.deleted_at')
			->where('p.status', 'paid')
			->whereBetween('p.waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('COALESCE(SUM(pi.qty * bom.qty_kebutuhan * bb.harga_beli_terakhir), 0) as total_hpp')
			->value('total_hpp');
	}

	// ─── Pajak, Service Charge, Diskon ────────────────────────────

	private function pajakTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('pos_pesanan')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->sum('pajak');
	}

	private function serviceChargeTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('pos_pesanan')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->sum('service_charge');
	}

	private function diskonTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('pos_pesanan')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->sum('diskon');
	}

	// ─── Pengeluaran & Petty Cash ─────────────────────────────────

	private function pengeluaranTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('finance_pengeluaran')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->sum('nominal');
	}

	private function pettyCashOutTotal(Carbon $start, Carbon $end): float
	{
		return (float) DB::table('finance_petty_cash')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('jenis_arus', 'out')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->sum('nominal');
	}

	private function hutangTotal(): float
	{
		return (float) DB::table('finance_hutang')
			->whereNull('deleted_at')
			->where('status', '!=', 'paid')
			->sum('sisa_hutang');
	}

	// ─── Expense Breakdown ────────────────────────────────────────

	private function expenseBreakdown(Carbon $start, Carbon $end): array
	{
		return DB::table('finance_pengeluaran')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->selectRaw('kategori_biaya, COUNT(*) as jumlah, COALESCE(SUM(nominal), 0) as total_nominal')
			->groupBy('kategori_biaya')
			->orderByDesc('total_nominal')
			->get()
			->map(fn ($row) => [
				'kategori' => (string) ($row->kategori_biaya ?? 'Lainnya'),
				'jumlah' => (int) $row->jumlah,
				'total_nominal' => (float) $row->total_nominal,
			])
			->all();
	}

	// ─── Daily Trend ──────────────────────────────────────────────

	private function dailyTrend(Carbon $start, Carbon $end): array
	{
		$revenues = PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('DATE(waktu_bayar) as tanggal, COALESCE(SUM(nominal_tagihan), 0) as revenue, COUNT(*) as transaksi')
			->groupByRaw('DATE(waktu_bayar)')
			->pluck('revenue', 'tanggal')
			->all();

		$transaksiByDate = PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('DATE(waktu_bayar) as tanggal, COUNT(*) as transaksi')
			->groupByRaw('DATE(waktu_bayar)')
			->pluck('transaksi', 'tanggal')
			->all();

		$period = CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay());
		$result = [];

		foreach ($period as $date) {
			$key = $date->toDateString();
			$result[] = [
				'tanggal' => $key,
				'revenue' => (float) ($revenues[$key] ?? 0),
				'transaksi' => (int) ($transaksiByDate[$key] ?? 0),
			];
		}

		return $result;
	}

	// ─── Period Resolution ────────────────────────────────────────

	private function resolvePeriodRange(string $periodType, string $referenceDate, ?string $dateFrom, ?string $dateTo): array
	{
		$allowed = ['daily', 'weekly', 'monthly', 'custom'];
		$normalizedPeriodType = in_array($periodType, $allowed, true) ? $periodType : 'daily';
		$reference = $this->safeParseDate($referenceDate) ?? now();

		if ($normalizedPeriodType === 'custom') {
			$start = $this->safeParseDate($dateFrom) ?? $reference->copy()->startOfMonth();
			$end = $this->safeParseDate($dateTo) ?? $reference->copy()->endOfMonth();
			if ($start->gt($end)) {
				[$start, $end] = [$end, $start];
			}
			return [$start->copy()->startOfDay(), $end->copy()->endOfDay(), $normalizedPeriodType, $reference->toDateString()];
		}

		if ($normalizedPeriodType === 'weekly') {
			return [$reference->copy()->startOfWeek(Carbon::MONDAY), $reference->copy()->endOfWeek(Carbon::SUNDAY), $normalizedPeriodType, $reference->toDateString()];
		}

		if ($normalizedPeriodType === 'monthly') {
			return [$reference->copy()->startOfMonth(), $reference->copy()->endOfMonth(), $normalizedPeriodType, $reference->toDateString()];
		}

		return [$reference->copy()->startOfDay(), $reference->copy()->endOfDay(), 'daily', $reference->toDateString()];
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

	public function buildExportTableHtml(array $report): string
	{
		$s = $report['summary'] ?? [];
		$eb = $report['expense_breakdown'] ?? [];
		$dt = $report['daily_trend'] ?? [];

		$html = '<div class="section-title">Ringkasan Keuangan</div>'
			. '<table><tbody>'
			. '<tr><th>Pendapatan</th><td>' . $this->formatCurrency((float) ($s['revenue'] ?? 0)) . '</td></tr>'
			. '<tr><th>HPP (COGS)</th><td>' . $this->formatCurrency((float) ($s['hpp'] ?? 0)) . '</td></tr>'
			. '<tr><th>Laba Kotor</th><td>' . $this->formatCurrency((float) ($s['gross_profit'] ?? 0)) . '</td></tr>'
			. '<tr><th>Margin</th><td>' . number_format((float) ($s['margin_persen'] ?? 0), 2, ',', '.') . '%</td></tr>'
			. '<tr><th>Pajak Terkumpul</th><td>' . $this->formatCurrency((float) ($s['pajak_terkumpul'] ?? 0)) . '</td></tr>'
			. '<tr><th>Service Charge</th><td>' . $this->formatCurrency((float) ($s['service_charge'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Diskon</th><td>' . $this->formatCurrency((float) ($s['total_diskon'] ?? 0)) . '</td></tr>'
			. '<tr><th>Pengeluaran</th><td>' . $this->formatCurrency((float) ($s['total_pengeluaran'] ?? 0)) . '</td></tr>'
			. '<tr><th>Petty Cash Keluar</th><td>' . $this->formatCurrency((float) ($s['petty_cash_keluar'] ?? 0)) . '</td></tr>'
			. '<tr><th>Hutang Aktif</th><td>' . $this->formatCurrency((float) ($s['total_hutang_aktif'] ?? 0)) . '</td></tr>'
			. '<tr><th style="font-weight:bold;">Net Income</th><td style="font-weight:bold;">' . $this->formatCurrency((float) ($s['net_income'] ?? 0)) . '</td></tr>'
			. '</tbody></table>';

		if (!empty($eb)) {
			$html .= '<div class="section-title">Breakdown Pengeluaran</div>'
				. '<table><thead><tr><th>Kategori</th><th style="text-align:right;">Jumlah</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($eb as $item) {
				$html .= '<tr><td>' . e($item['kategori'] ?? '-') . '</td><td style="text-align:right;">' . ($item['jumlah'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_nominal'] ?? 0)) . '</td></tr>';
			}
			$html .= '</tbody></table>';
		}

		if (!empty($dt)) {
			$html .= '<div class="section-title">Tren Harian</div>'
				. '<table><thead><tr><th>Tanggal</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Pendapatan</th></tr></thead><tbody>';
			foreach ($dt as $item) {
				$html .= '<tr><td>' . e($item['tanggal'] ?? '-') . '</td><td style="text-align:right;">' . ($item['transaksi'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['revenue'] ?? 0)) . '</td></tr>';
			}
			$html .= '</tbody></table>';
		}

		return $html;
	}
}
