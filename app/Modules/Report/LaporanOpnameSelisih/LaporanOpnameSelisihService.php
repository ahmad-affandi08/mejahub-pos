<?php

namespace App\Modules\Report\LaporanOpnameSelisih;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanOpnameSelisihService
{
	use ReportExportTrait;

	public function buildDashboard(string $periodType = 'monthly', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null): array
	{
		[$start, $end, $nType, $nRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);

		$totalOpname = (int) DB::table('inventory_opname_stok')->whereNull('deleted_at')->whereBetween('tanggal_opname', [$start->toDateString(), $end->toDateString()])->count();
		$totalSelisihPositif = (float) DB::table('inventory_opname_stok')->whereNull('deleted_at')->whereBetween('tanggal_opname', [$start->toDateString(), $end->toDateString()])->where('selisih', '>', 0)->sum('selisih');
		$totalSelisihNegatif = (float) DB::table('inventory_opname_stok')->whereNull('deleted_at')->whereBetween('tanggal_opname', [$start->toDateString(), $end->toDateString()])->where('selisih', '<', 0)->sum('selisih');

		$details = DB::table('inventory_opname_stok as o')
			->join('inventory_bahan_baku as bb', 'bb.id', '=', 'o.bahan_baku_id')
			->leftJoin('users as u', 'u.id', '=', 'o.user_id')
			->whereNull('o.deleted_at')
			->whereBetween('o.tanggal_opname', [$start->toDateString(), $end->toDateString()])
			->select(['o.kode', 'o.tanggal_opname', 'bb.nama as bahan', 'bb.satuan', 'o.stok_sistem', 'o.stok_fisik', 'o.selisih', 'o.alasan', 'u.name as petugas', 'bb.harga_beli_terakhir'])
			->orderByDesc('o.tanggal_opname')
			->limit(50)
			->get()
			->map(function ($r) {
				$selisih = (float) $r->selisih;
				$stokSistem = (float) $r->stok_sistem;
				$persenSelisih = $stokSistem > 0 ? abs($selisih / $stokSistem) * 100 : 0;
				$nilaiSelisih = abs($selisih) * (float) ($r->harga_beli_terakhir ?? 0);

				$level = 'normal';
				if ($persenSelisih > 10) $level = 'danger';
				elseif ($persenSelisih > 5) $level = 'warning';

				return [
					'kode' => (string) $r->kode,
					'tanggal' => (string) $r->tanggal_opname,
					'bahan' => (string) $r->bahan,
					'satuan' => (string) $r->satuan,
					'stok_sistem' => round($stokSistem, 3),
					'stok_fisik' => round((float) $r->stok_fisik, 3),
					'selisih' => round($selisih, 3),
					'persen_selisih' => round($persenSelisih, 2),
					'nilai_selisih' => round($nilaiSelisih, 2),
					'level' => $level,
					'alasan' => (string) ($r->alasan ?? '-'),
					'petugas' => (string) ($r->petugas ?? '-'),
				];
			})->all();

		$dangerCount = count(array_filter($details, fn ($d) => $d['level'] === 'danger'));
		$warningCount = count(array_filter($details, fn ($d) => $d['level'] === 'warning'));

		return [
			'filters' => ['period_type' => $nType, 'reference_date' => $nRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'summary' => ['total_opname' => $totalOpname, 'selisih_positif' => round($totalSelisihPositif, 3), 'selisih_negatif' => round($totalSelisihNegatif, 3), 'danger_count' => $dangerCount, 'warning_count' => $warningCount],
			'details' => $details,
		];
	}

	private function resolvePeriod(string $pt, string $rd, ?string $df, ?string $dt): array
	{
		$allowed = ['daily', 'weekly', 'monthly', 'custom'];
		$n = in_array($pt, $allowed, true) ? $pt : 'monthly';
		$ref = $this->safe($rd) ?? now();
		if ($n === 'custom') { $s = $this->safe($df) ?? $ref->copy()->startOfMonth(); $e = $this->safe($dt) ?? $ref->copy()->endOfMonth(); if ($s->gt($e)) [$s,$e]=[$e,$s]; return [$s->startOfDay(),$e->endOfDay(),$n,$ref->toDateString()]; }
		if ($n === 'weekly') return [$ref->copy()->startOfWeek(Carbon::MONDAY),$ref->copy()->endOfWeek(Carbon::SUNDAY),$n,$ref->toDateString()];
		if ($n === 'monthly') return [$ref->copy()->startOfMonth(),$ref->copy()->endOfMonth(),$n,$ref->toDateString()];
		return [$ref->copy()->startOfDay(),$ref->copy()->endOfDay(),'daily',$ref->toDateString()];
	}
	private function safe(?string $v): ?Carbon { if (!is_string($v)||trim($v)==='') return null; try { return Carbon::parse($v); } catch (\Throwable) { return null; } }

	public function buildExportTableHtml(array $report): string
	{
		$s = $report['summary'] ?? [];
		$html = '<div class="section-title">Ringkasan</div><table><tbody>'
			. '<tr><th>Total Opname</th><td>' . ($s['total_opname'] ?? 0) . '</td></tr>'
			. '<tr><th>Selisih Positif</th><td>+' . ($s['selisih_positif'] ?? 0) . '</td></tr>'
			. '<tr><th>Selisih Negatif</th><td>' . ($s['selisih_negatif'] ?? 0) . '</td></tr>'
			. '<tr><th>BAHAYA / WASPADA</th><td>' . ($s['danger_count'] ?? 0) . ' / ' . ($s['warning_count'] ?? 0) . '</td></tr>'
			. '</tbody></table>';

		$details = $report['details'] ?? [];
		if (!empty($details)) {
			$html .= '<div class="section-title">Detail Selisih</div><table><thead><tr><th>Tgl</th><th>Bahan</th><th>Satuan</th><th style="text-align:right;">Sistem</th><th style="text-align:right;">Fisik</th><th style="text-align:right;">Selisih</th><th style="text-align:right;">%</th><th style="text-align:right;">Nilai</th><th>Status</th><th>Petugas</th></tr></thead><tbody>';
			foreach ($details as $d) { $html .= '<tr><td>' . e($d['tanggal']) . '</td><td>' . e($d['bahan']) . '</td><td>' . e($d['satuan']) . '</td><td style="text-align:right;">' . $d['stok_sistem'] . '</td><td style="text-align:right;">' . $d['stok_fisik'] . '</td><td style="text-align:right;">' . $d['selisih'] . '</td><td style="text-align:right;">' . $d['persen_selisih'] . '%</td><td style="text-align:right;">' . $this->formatCurrency((float) $d['nilai_selisih']) . '</td><td>' . strtoupper($d['level']) . '</td><td>' . e($d['petugas']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}
		return $html;
	}
}
