<?php

namespace App\Modules\Report\LaporanHeatmap;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanHeatmapService
{
	use ReportExportTrait;

	private const DAY_LABELS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

	public function buildDashboard(string $periodType = 'weekly', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null): array
	{
		[$start, $end, $nType, $nRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);

		$rows = DB::table('pos_pembayaran')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('DAYOFWEEK(waktu_bayar) as dow, HOUR(waktu_bayar) as jam, COUNT(*) as jumlah, COALESCE(SUM(nominal_tagihan), 0) as revenue')
			->groupByRaw('DAYOFWEEK(waktu_bayar), HOUR(waktu_bayar)')
			->get();

		// Build 7x24 matrix: days (Mon-Sun) x hours (0-23)
		$matrix = [];
		$maxCount = 0;

		foreach (self::DAY_LABELS as $idx => $dayLabel) {
			$matrix[$dayLabel] = [];
			for ($h = 0; $h < 24; $h++) {
				$matrix[$dayLabel][$h] = ['jumlah' => 0, 'revenue' => 0];
			}
		}

		foreach ($rows as $row) {
			// MySQL DAYOFWEEK: 1=Sunday, 2=Monday ... 7=Saturday
			// We want: 0=Monday ... 6=Sunday
			$mysqlDow = (int) $row->dow;
			$idx = ($mysqlDow + 5) % 7; // convert: Mon=0 ... Sun=6
			$dayLabel = self::DAY_LABELS[$idx];
			$jam = (int) $row->jam;

			$matrix[$dayLabel][$jam] = [
				'jumlah' => (int) $row->jumlah,
				'revenue' => (float) $row->revenue,
			];

			if ((int) $row->jumlah > $maxCount) {
				$maxCount = (int) $row->jumlah;
			}
		}

		// Find peak hour
		$peakHour = null;
		$peakDay = null;
		$peakCount = 0;
		foreach ($matrix as $dayLabel => $hours) {
			foreach ($hours as $hour => $data) {
				if ($data['jumlah'] > $peakCount) {
					$peakCount = $data['jumlah'];
					$peakHour = $hour;
					$peakDay = $dayLabel;
				}
			}
		}

		// Aggregate per-hour totals
		$hourlyTotals = [];
		for ($h = 0; $h < 24; $h++) {
			$total = 0;
			foreach (self::DAY_LABELS as $dayLabel) {
				$total += $matrix[$dayLabel][$h]['jumlah'];
			}
			$hourlyTotals[] = ['jam' => sprintf('%02d:00', $h), 'jumlah' => $total];
		}

		return [
			'filters' => ['period_type' => $nType, 'reference_date' => $nRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'heatmap' => $matrix,
			'max_count' => $maxCount,
			'peak' => ['day' => $peakDay, 'hour' => $peakHour !== null ? sprintf('%02d:00', $peakHour) : '-', 'count' => $peakCount],
			'hourly_totals' => $hourlyTotals,
			'days' => self::DAY_LABELS,
		];
	}

	private function resolvePeriod(string $pt, string $rd, ?string $df, ?string $dt): array
	{
		$allowed = ['daily', 'weekly', 'monthly', 'custom'];
		$n = in_array($pt, $allowed, true) ? $pt : 'weekly';
		$ref = $this->safe($rd) ?? now();
		if ($n === 'custom') { $s = $this->safe($df) ?? $ref->copy()->startOfMonth(); $e = $this->safe($dt) ?? $ref->copy()->endOfMonth(); if ($s->gt($e)) [$s,$e]=[$e,$s]; return [$s->startOfDay(),$e->endOfDay(),$n,$ref->toDateString()]; }
		if ($n === 'weekly') return [$ref->copy()->startOfWeek(Carbon::MONDAY),$ref->copy()->endOfWeek(Carbon::SUNDAY),$n,$ref->toDateString()];
		if ($n === 'monthly') return [$ref->copy()->startOfMonth(),$ref->copy()->endOfMonth(),$n,$ref->toDateString()];
		return [$ref->copy()->startOfDay(),$ref->copy()->endOfDay(),'daily',$ref->toDateString()];
	}
	private function safe(?string $v): ?Carbon { if (!is_string($v)||trim($v)==='') return null; try { return Carbon::parse($v); } catch (\Throwable) { return null; } }

	public function buildExportTableHtml(array $report): string
	{
		$peak = $report['peak'] ?? [];
		$days = $report['days'] ?? [];
		$heatmap = $report['heatmap'] ?? [];

		$html = '<div class="section-title">Jam Tersibuk</div><table><tbody>'
			. '<tr><th>Hari</th><td>' . e($peak['day'] ?? '-') . '</td></tr>'
			. '<tr><th>Jam</th><td>' . e($peak['hour'] ?? '-') . '</td></tr>'
			. '<tr><th>Jumlah Transaksi</th><td>' . ($peak['count'] ?? 0) . '</td></tr>'
			. '</tbody></table>';

		$html .= '<div class="section-title">Heatmap (Hari × Jam)</div><table><thead><tr><th>Hari</th>';
		for ($h = 0; $h < 24; $h++) { $html .= '<th style="text-align:center;">' . sprintf('%02d', $h) . '</th>'; }
		$html .= '</tr></thead><tbody>';
		foreach ($days as $day) {
			$html .= '<tr><td>' . e($day) . '</td>';
			for ($h = 0; $h < 24; $h++) {
				$count = $heatmap[$day][$h]['jumlah'] ?? 0;
				$html .= '<td style="text-align:center;">' . ($count > 0 ? $count : '') . '</td>';
			}
			$html .= '</tr>';
		}
		$html .= '</tbody></table>';

		return $html;
	}
}
