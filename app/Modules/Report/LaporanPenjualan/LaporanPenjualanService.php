<?php

namespace App\Modules\Report\LaporanPenjualan;

use App\Modules\HR\Penggajian\PenggajianEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Modules\Settings\MetodePembayaran\MetodePembayaranEntity;
use App\Modules\Settings\ProfilToko\ProfilTokoEntity;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class LaporanPenjualanService
{
	public function storeProfileHeader(): array
	{
		$profile = ProfilTokoEntity::query()
			->where('is_active', true)
			->orderByDesc('is_default')
			->orderByDesc('id')
			->first();

		if (!$profile) {
			return [
				'nama_toko' => 'Mejahub POS',
				'nama_brand' => null,
				'kode_toko' => null,
				'alamat_lengkap' => '-',
				'telepon' => '-',
				'email' => '-',
				'npwp' => null,
			];
		}

		$alamat = collect([
			$profile->alamat,
			$profile->kota,
			$profile->provinsi,
			$profile->kode_pos,
		])->filter(fn ($item) => is_string($item) && trim($item) !== '')->implode(', ');

		return [
			'nama_toko' => $profile->nama_toko,
			'nama_brand' => $profile->nama_brand,
			'kode_toko' => $profile->kode_toko,
			'alamat_lengkap' => $alamat !== '' ? $alamat : '-',
			'telepon' => $profile->telepon ?: '-',
			'email' => $profile->email ?: '-',
			'npwp' => $profile->npwp,
		];
	}

	public function exportFileName(array $filters, string $exportType): string
	{
		$periodType = (string) ($filters['period_type'] ?? 'daily');
		$start = (string) ($filters['effective_range']['start'] ?? now()->toDateString());
		$end = (string) ($filters['effective_range']['end'] ?? now()->toDateString());

		$periodLabelMap = [
			'daily' => 'harian',
			'weekly' => 'mingguan',
			'monthly' => 'bulanan',
			'custom' => 'custom',
		];

		$periodLabel = $periodLabelMap[$periodType] ?? 'harian';
		$safeStart = str_replace('-', '', $start);
		$safeEnd = str_replace('-', '', $end);
		$ext = strtolower($exportType) === 'pdf' ? 'pdf' : 'xls';

		return "laporan-penjualan-{$periodLabel}-{$safeStart}-sampai-{$safeEnd}.{$ext}";
	}

	public function renderPdfHtml(array $storeProfile, array $report, array $filters): string
	{
		return $this->buildExportHtml($storeProfile, $report, $filters, false);
	}

	public function renderExcelHtml(array $storeProfile, array $report, array $filters): string
	{
		return "\xEF\xBB\xBF" . $this->buildExportHtml($storeProfile, $report, $filters, true);
	}

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

	private function buildExportHtml(array $storeProfile, array $report, array $filters, bool $forExcel): string
	{
		$summary = $report['summary'] ?? [];
		$topItems = $report['top_items'] ?? [];
		$paymentMethods = $report['payment_methods'] ?? [];
		$payroll = $report['payroll_vs_revenue'] ?? [];
		$dailyTrend = $report['daily_trend'] ?? [];
		$rangeLabel = (string) ($filters['effective_range']['label'] ?? '-');

		$headerStyle = $forExcel
			? ''
			: 'style="font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #0f172a;"';

		$topRows = '';
		foreach ($topItems as $index => $item) {
			$no = $index + 1;
			$topRows .= '<tr>'
				. '<td>' . $no . '</td>'
				. '<td>' . e((string) ($item['nama_menu'] ?? '-')) . '</td>'
				. '<td style="text-align:right;">' . (int) ($item['total_qty'] ?? 0) . '</td>'
				. '<td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_penjualan'] ?? 0)) . '</td>'
				. '</tr>';
		}

		if ($topRows === '') {
			$topRows = '<tr><td colspan="4" style="text-align:center;">Tidak ada data</td></tr>';
		}

		$paymentRows = '';
		foreach ($paymentMethods as $item) {
			$paymentRows .= '<tr>'
				. '<td>' . e((string) ($item['nama'] ?? '-')) . '</td>'
				. '<td style="text-align:right;">' . (int) ($item['jumlah_transaksi'] ?? 0) . '</td>'
				. '<td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_nominal'] ?? 0)) . '</td>'
				. '</tr>';
		}

		if ($paymentRows === '') {
			$paymentRows = '<tr><td colspan="3" style="text-align:center;">Tidak ada data</td></tr>';
		}

		$trendRows = '';
		foreach ($dailyTrend as $item) {
			$trendRows .= '<tr>'
				. '<td>' . e((string) ($item['tanggal'] ?? '-')) . '</td>'
				. '<td style="text-align:right;">' . (int) ($item['jumlah_transaksi'] ?? 0) . '</td>'
				. '<td style="text-align:right;">' . $this->formatCurrency((float) ($item['omzet'] ?? 0)) . '</td>'
				. '</tr>';
		}

		if ($trendRows === '') {
			$trendRows = '<tr><td colspan="3" style="text-align:center;">Tidak ada data</td></tr>';
		}

		return '<html><head><meta charset="UTF-8" />'
			. '<title>Laporan Penjualan</title>'
			. '<style>
				body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #0f172a; }
				table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
				th, td { border: 1px solid #cbd5e1; padding: 6px; }
				th { background: #e2e8f0; text-align: left; }
				.section-title { font-size: 13px; font-weight: bold; margin: 14px 0 8px; }
			</style></head><body ' . $headerStyle . '>'
			. '<h2 style="margin:0;">' . e((string) ($storeProfile['nama_toko'] ?? 'Mejahub POS')) . '</h2>'
			. (!empty($storeProfile['nama_brand']) ? '<p style="margin:3px 0;">' . e((string) $storeProfile['nama_brand']) . '</p>' : '')
			. '<p style="margin:3px 0;">Kode Toko: ' . e((string) ($storeProfile['kode_toko'] ?? '-')) . '</p>'
			. '<p style="margin:3px 0;">Alamat: ' . e((string) ($storeProfile['alamat_lengkap'] ?? '-')) . '</p>'
			. '<p style="margin:3px 0;">Telepon: ' . e((string) ($storeProfile['telepon'] ?? '-')) . ' | Email: ' . e((string) ($storeProfile['email'] ?? '-')) . '</p>'
			. (!empty($storeProfile['npwp']) ? '<p style="margin:3px 0;">NPWP: ' . e((string) $storeProfile['npwp']) . '</p>' : '')
			. '<hr />'
			. '<h3 style="margin:8px 0 4px;">Laporan Penjualan</h3>'
			. '<p style="margin:0 0 10px;">Periode: ' . e($rangeLabel) . '</p>'
			. '<div class="section-title">Ringkasan</div>'
			. '<table><tbody>'
			. '<tr><th>Omzet</th><td>' . $this->formatCurrency((float) ($summary['omzet'] ?? 0)) . '</td></tr>'
			. '<tr><th>Jumlah Transaksi</th><td>' . (int) ($summary['jumlah_transaksi'] ?? 0) . '</td></tr>'
			. '<tr><th>Rata-rata Transaksi</th><td>' . $this->formatCurrency((float) ($summary['rata_rata_transaksi'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Dibayar</th><td>' . $this->formatCurrency((float) ($summary['nominal_dibayar'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Kembalian</th><td>' . $this->formatCurrency((float) ($summary['kembalian'] ?? 0)) . '</td></tr>'
			. '</tbody></table>'
			. '<div class="section-title">Item Terlaris</div>'
			. '<table><thead><tr><th>No</th><th>Menu</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Nilai Penjualan</th></tr></thead><tbody>' . $topRows . '</tbody></table>'
			. '<div class="section-title">Metode Pembayaran</div>'
			. '<table><thead><tr><th>Metode</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>' . $paymentRows . '</tbody></table>'
			. '<div class="section-title">Payroll vs Pendapatan</div>'
			. '<table><tbody>'
			. '<tr><th>Pendapatan</th><td>' . $this->formatCurrency((float) ($payroll['pendapatan'] ?? 0)) . '</td></tr>'
			. '<tr><th>Penggajian</th><td>' . $this->formatCurrency((float) ($payroll['penggajian'] ?? 0)) . '</td></tr>'
			. '<tr><th>Selisih</th><td>' . $this->formatCurrency((float) ($payroll['selisih'] ?? 0)) . '</td></tr>'
			. '<tr><th>Rasio Payroll</th><td>' . number_format((float) ($payroll['rasio_persen'] ?? 0), 2, ',', '.') . '%</td></tr>'
			. '</tbody></table>'
			. '<div class="section-title">Tren Harian</div>'
			. '<table><thead><tr><th>Tanggal</th><th style="text-align:right;">Transaksi</th><th style="text-align:right;">Omzet</th></tr></thead><tbody>' . $trendRows . '</tbody></table>'
			. '</body></html>';
	}

	private function formatCurrency(float $value): string
	{
		return 'Rp ' . number_format($value, 0, ',', '.');
	}
}
