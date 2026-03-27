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
		$topItems = $this->topItems($start, $end, $topLimit);
		$paymentMethods = $this->paymentMethodBreakdown($start, $end);
		$payrollVsRevenue = $this->payrollVsRevenue($start, $end, (float) $summary['omzet']);
		$dailyTrend = $this->dailyTrend($start, $end);

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
			'top_items' => $topItems,
			'payment_methods' => $paymentMethods,
			'payroll_vs_revenue' => $payrollVsRevenue,
			'daily_trend' => $dailyTrend,
		];
	}

	public function buildExportTableHtml(array $report): string
	{
		$summary = $report['summary'] ?? [];
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

		if (!empty($dailyTrend)) {
			$html .= '<div class="section-title">Tren Harian</div><table><thead><tr><th>Tanggal</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Omzet</th></tr></thead><tbody>';
			foreach ($dailyTrend as $item) { $html .= '<tr><td>' . e($item['tanggal'] ?? '-') . '</td><td style="text-align:right;">' . (int) ($item['jumlah_transaksi'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['omzet'] ?? 0)) . '</td></tr>'; }
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
		$period = CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay());

		$result = [];

		foreach ($period as $date) {
			$key = $date->toDateString();
			$item = $indexed->get($key);

			$result[] = [
				'tanggal' => $key,
				'jumlah_transaksi' => (int) ($item->jumlah_transaksi ?? 0),
				'omzet' => (float) ($item->omzet ?? 0),
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
}
