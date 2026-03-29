<?php

namespace App\Modules\Report\LaporanPenjualan;

use App\Modules\HR\Penggajian\PenggajianEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Modules\Settings\MetodePembayaran\MetodePembayaranEntity;
use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class LaporanPenjualanService
{
	use ReportExportTrait;

	public function buildDashboard(
		string $periodType = 'daily',
		string $referenceDate = '',
		?string $dateFrom = null,
		?string $dateTo = null,
		int $topLimit = 10,
	): array {
		[$start, $end, $normalizedPeriodType, $normalizedReferenceDate] = $this->resolvePeriodRange($periodType, $referenceDate, $dateFrom, $dateTo);
		$topLimit = max(3, min($topLimit, 25));

		$summary = $this->salesSummary($start, $end);
		$pengeluaran = $this->pengeluaranTotal($start, $end);
		$pettyCashKeluar = $this->pettyCashOutTotal($start, $end);
		$totalBebanOperasional = $pengeluaran + $pettyCashKeluar;
		$expenseBreakdown = $this->expenseBreakdown($start, $end);
		$topItems = $this->topItems($start, $end, $topLimit);
		$paymentMethods = $this->paymentMethodBreakdown($start, $end);
		$payrollVsRevenue = $this->payrollVsRevenue($start, $end, (float) $summary['omzet']);
		$dailyTrend = $this->dailyTrend($start, $end);

		$summary['total_pengeluaran'] = $pengeluaran;
		$summary['petty_cash_keluar'] = $pettyCashKeluar;
		$summary['total_beban_operasional'] = $totalBebanOperasional;
		$summary['net_omzet_operasional'] = (float) $summary['omzet'] - $totalBebanOperasional;

		return [
			'filters' => [
				'period_type' => $normalizedPeriodType,
				'reference_date' => $normalizedReferenceDate,
				'date_from' => $dateFrom,
				'date_to' => $dateTo,
				'top_limit' => $topLimit,
				'effective_range' => [
					'start' => $start->toDateString(),
					'end' => $end->toDateString(),
					'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY'),
				],
			],
			'summary' => $summary,
			'expense_breakdown' => $expenseBreakdown,
			'top_items' => $topItems,
			'payment_methods' => $paymentMethods,
			'payroll_vs_revenue' => $payrollVsRevenue,
			'daily_trend' => $dailyTrend,
		];
	}

	public function buildExportTableHtml(array $report): string
	{
		$summary = $report['summary'] ?? [];
		$expenseBreakdown = $report['expense_breakdown'] ?? [];
		$topItems = $report['top_items'] ?? [];
		$paymentMethods = $report['payment_methods'] ?? [];
		$payroll = $report['payroll_vs_revenue'] ?? [];
		$dailyTrend = $report['daily_trend'] ?? [];

		$html = '<div class="section-title">Ringkasan</div><table><tbody>'
			. '<tr><th>Omzet</th><td>' . $this->formatCurrency((float) ($summary['omzet'] ?? 0)) . '</td></tr>'
			. '<tr><th>Jumlah Transaksi</th><td>' . (int) ($summary['jumlah_transaksi'] ?? 0) . '</td></tr>'
			. '<tr><th>Rata-rata Transaksi</th><td>' . $this->formatCurrency((float) ($summary['rata_rata_transaksi'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Dibayar</th><td>' . $this->formatCurrency((float) ($summary['nominal_dibayar'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Kembalian</th><td>' . $this->formatCurrency((float) ($summary['kembalian'] ?? 0)) . '</td></tr>'
			. '<tr><th>Pengeluaran</th><td>' . $this->formatCurrency((float) ($summary['total_pengeluaran'] ?? 0)) . '</td></tr>'
			. '<tr><th>Petty Cash Keluar</th><td>' . $this->formatCurrency((float) ($summary['petty_cash_keluar'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Beban Operasional</th><td>' . $this->formatCurrency((float) ($summary['total_beban_operasional'] ?? 0)) . '</td></tr>'
			. '<tr><th>Net Omzet Operasional</th><td>' . $this->formatCurrency((float) ($summary['net_omzet_operasional'] ?? 0)) . '</td></tr>'
			. '</tbody></table>';

		if (!empty($topItems)) {
			$html .= '<div class="section-title">Item Terlaris</div><table><thead><tr><th>No</th><th>Menu</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Nilai Penjualan</th></tr></thead><tbody>';
			foreach ($topItems as $i => $item) { $html .= '<tr><td>' . ($i + 1) . '</td><td>' . e($item['nama_menu'] ?? '-') . '</td><td style="text-align:right;">' . (int) ($item['total_qty'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_penjualan'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		if (!empty($paymentMethods)) {
			$html .= '<div class="section-title">Metode Pembayaran</div><table><thead><tr><th>Metode</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($paymentMethods as $item) { $html .= '<tr><td>' . e($item['nama'] ?? '-') . '</td><td style="text-align:right;">' . (int) ($item['jumlah_transaksi'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_nominal'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		$html .= '<div class="section-title">Payroll vs Pendapatan</div><table><tbody>'
			. '<tr><th>Pendapatan</th><td>' . $this->formatCurrency((float) ($payroll['pendapatan'] ?? 0)) . '</td></tr>'
			. '<tr><th>Penggajian</th><td>' . $this->formatCurrency((float) ($payroll['penggajian'] ?? 0)) . '</td></tr>'
			. '<tr><th>Selisih</th><td>' . $this->formatCurrency((float) ($payroll['selisih'] ?? 0)) . '</td></tr>'
			. '<tr><th>Rasio Payroll</th><td>' . number_format((float) ($payroll['rasio_persen'] ?? 0), 2, ',', '.') . '%</td></tr>'
			. '</tbody></table>';

		if (!empty($expenseBreakdown)) {
			$html .= '<div class="section-title">Breakdown Pengeluaran</div><table><thead><tr><th>Kategori</th><th style="text-align:right;">Jumlah</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($expenseBreakdown as $item) { $html .= '<tr><td>' . e($item['kategori'] ?? '-') . '</td><td style="text-align:right;">' . (int) ($item['jumlah'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_nominal'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		if (!empty($dailyTrend)) {
			$html .= '<div class="section-title">Tren Harian</div><table><thead><tr><th>Tanggal</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Omzet</th><th style="text-align:right;">Pengeluaran</th><th style="text-align:right;">Petty Cash Keluar</th><th style="text-align:right;">Net</th></tr></thead><tbody>';
			foreach ($dailyTrend as $item) { $html .= '<tr><td>' . e($item['tanggal'] ?? '-') . '</td><td style="text-align:right;">' . (int) ($item['jumlah_transaksi'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['omzet'] ?? 0)) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['pengeluaran'] ?? 0)) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['petty_cash_keluar'] ?? 0)) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['net_omzet_operasional'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
	}

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

	private function salesSummary(Carbon $start, Carbon $end): array
	{
		$baseQuery = PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()]);

		$jumlahTransaksi = (int) (clone $baseQuery)->count();
		$omzet = (float) (clone $baseQuery)->sum('nominal_tagihan');
		$nominalDibayar = (float) (clone $baseQuery)->sum('nominal_dibayar');
		$kembalian = (float) (clone $baseQuery)->sum('kembalian');

		return [
			'jumlah_transaksi' => $jumlahTransaksi,
			'omzet' => $omzet,
			'rata_rata_transaksi' => $jumlahTransaksi > 0 ? $omzet / $jumlahTransaksi : 0,
			'nominal_dibayar' => $nominalDibayar,
			'kembalian' => $kembalian,
		];
	}

	private function topItems(Carbon $start, Carbon $end, int $limit): array
	{
		$rows = DB::table('pos_pesanan_item as item')
			->join('pos_pesanan as pesanan', 'pesanan.id', '=', 'item.pesanan_id')
			->whereNull('item.deleted_at')
			->whereNull('pesanan.deleted_at')
			->where('pesanan.status', 'paid')
			->whereBetween('pesanan.waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('item.nama_menu as nama_menu, SUM(item.qty) as total_qty, SUM(item.subtotal) as total_penjualan')
			->groupBy('item.nama_menu')
			->orderByDesc('total_qty')
			->orderByDesc('total_penjualan')
			->limit($limit)
			->get();

		return $rows->map(fn ($row) => [
			'nama_menu' => (string) ($row->nama_menu ?? '-'),
			'total_qty' => (int) ($row->total_qty ?? 0),
			'total_penjualan' => (float) ($row->total_penjualan ?? 0),
		])->values()->all();
	}

	private function paymentMethodBreakdown(Carbon $start, Carbon $end): array
	{
		$methodNames = MetodePembayaranEntity::query()
			->pluck('nama', 'kode')
			->all();

		$summary = [];
		$payments = PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->get(['metode_bayar', 'nominal_tagihan', 'payment_details']);

		foreach ($payments as $payment) {
			$details = collect($payment->payment_details ?? []);

			if ($details->isNotEmpty()) {
				$usedInTxn = [];

				foreach ($details as $detail) {
					$methodCode = (string) ($detail['metode_bayar'] ?? 'unknown');
					$nominal = (float) ($detail['nominal'] ?? 0);

					if ($nominal <= 0) {
						continue;
					}

					if (!isset($summary[$methodCode])) {
						$summary[$methodCode] = [
							'kode' => $methodCode,
							'nama' => $methodNames[$methodCode] ?? strtoupper($methodCode),
							'jumlah_transaksi' => 0,
							'total_nominal' => 0,
						];
					}

					$summary[$methodCode]['total_nominal'] += $nominal;

					if (!in_array($methodCode, $usedInTxn, true)) {
						$summary[$methodCode]['jumlah_transaksi']++;
						$usedInTxn[] = $methodCode;
					}
				}

				continue;
			}

			$methodCode = (string) ($payment->metode_bayar ?: 'unknown');

			if (!isset($summary[$methodCode])) {
				$summary[$methodCode] = [
					'kode' => $methodCode,
					'nama' => $methodNames[$methodCode] ?? strtoupper($methodCode),
					'jumlah_transaksi' => 0,
					'total_nominal' => 0,
				];
			}

			$summary[$methodCode]['jumlah_transaksi']++;
			$summary[$methodCode]['total_nominal'] += (float) $payment->nominal_tagihan;
		}

		return collect($summary)
			->sortByDesc('total_nominal')
			->values()
			->map(fn ($item) => [
				'kode' => $item['kode'],
				'nama' => $item['nama'],
				'jumlah_transaksi' => (int) $item['jumlah_transaksi'],
				'total_nominal' => (float) $item['total_nominal'],
			])
			->all();
	}

	private function payrollVsRevenue(Carbon $start, Carbon $end, float $omzet): array
	{
		$startYm = $start->format('Y-m');
		$endYm = $end->format('Y-m');

		$payrollTotal = (float) PenggajianEntity::query()
			->where('is_active', true)
			->where('status', '!=', 'dibatalkan')
			->where(function ($query) use ($start, $end, $startYm, $endYm) {
				$query
					->whereBetween('tanggal_pembayaran', [$start->toDateString(), $end->toDateString()])
					->orWhere(function ($inner) use ($startYm, $endYm) {
						$inner
							->whereNull('tanggal_pembayaran')
							->whereBetween('periode', [$startYm, $endYm]);
					});
			})
			->sum('total_gaji');

		$ratio = $omzet > 0 ? ($payrollTotal / $omzet) * 100 : 0;

		return [
			'pendapatan' => $omzet,
			'penggajian' => $payrollTotal,
			'selisih' => $omzet - $payrollTotal,
			'rasio_persen' => $ratio,
		];
	}

	private function dailyTrend(Carbon $start, Carbon $end): array
	{
		$rows = PembayaranEntity::query()
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('DATE(waktu_bayar) as tanggal, COUNT(*) as jumlah_transaksi, COALESCE(SUM(nominal_tagihan), 0) as omzet')
			->groupByRaw('DATE(waktu_bayar)')
			->orderByRaw('DATE(waktu_bayar)')
			->get();

		$indexed = $rows->keyBy('tanggal');
		$pengeluaranByDate = DB::table('finance_pengeluaran')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->selectRaw('DATE(tanggal) as tanggal, COALESCE(SUM(nominal), 0) as total_pengeluaran')
			->groupByRaw('DATE(tanggal)')
			->pluck('total_pengeluaran', 'tanggal')
			->all();

		$pettyCashByDate = DB::table('finance_petty_cash')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->where('jenis_arus', 'out')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->selectRaw('DATE(tanggal) as tanggal, COALESCE(SUM(nominal), 0) as total_petty_cash')
			->groupByRaw('DATE(tanggal)')
			->pluck('total_petty_cash', 'tanggal')
			->all();

		$period = CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay());

		$result = [];

		foreach ($period as $date) {
			$key = $date->toDateString();
			$item = $indexed->get($key);
			$pengeluaran = (float) ($pengeluaranByDate[$key] ?? 0);
			$pettyCashKeluar = (float) ($pettyCashByDate[$key] ?? 0);
			$omzet = (float) ($item->omzet ?? 0);

			$result[] = [
				'tanggal' => $key,
				'jumlah_transaksi' => (int) ($item->jumlah_transaksi ?? 0),
				'omzet' => $omzet,
				'pengeluaran' => $pengeluaran,
				'petty_cash_keluar' => $pettyCashKeluar,
				'total_beban_operasional' => $pengeluaran + $pettyCashKeluar,
				'net_omzet_operasional' => $omzet - $pengeluaran - $pettyCashKeluar,
			];
		}

		return $result;
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
			->where('status_approval', 'approved')
			->where('jenis_arus', 'out')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->sum('nominal');
	}

	private function expenseBreakdown(Carbon $start, Carbon $end): array
	{
		$items = DB::table('finance_pengeluaran')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->selectRaw('kategori_biaya, COUNT(*) as jumlah, COALESCE(SUM(nominal), 0) as total_nominal')
			->groupBy('kategori_biaya')
			->get()
			->map(fn ($row) => [
				'kategori' => (string) ($row->kategori_biaya ?? 'Lainnya'),
				'jumlah' => (int) $row->jumlah,
				'total_nominal' => (float) $row->total_nominal,
			]);

		$pettyCashRows = (int) DB::table('finance_petty_cash')
			->whereNull('deleted_at')
			->where('is_active', true)
			->where('status_approval', 'approved')
			->where('jenis_arus', 'out')
			->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->count();

		$pettyCashTotal = $this->pettyCashOutTotal($start, $end);

		if ($pettyCashRows > 0 || $pettyCashTotal > 0) {
			$items->push([
				'kategori' => 'Petty Cash',
				'jumlah' => $pettyCashRows,
				'total_nominal' => (float) $pettyCashTotal,
			]);
		}

		return $items
			->sortByDesc('total_nominal')
			->values()
			->all();
	}
}
