<?php

namespace App\Modules\Report\LaporanWaste;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanWasteService
{
	use ReportExportTrait;

	public function buildDashboard(string $periodType = 'daily', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null): array
	{
		[$start, $end, $nType, $nRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);

		$totalWasteQty = (float) DB::table('inventory_manajemen_waste')->whereNull('deleted_at')->whereBetween('tanggal_waste', [$start->toDateString(), $end->toDateString()])->sum('qty_waste');

		$wasteValue = (float) DB::table('inventory_manajemen_waste as w')
			->join('inventory_bahan_baku as bb', 'bb.id', '=', 'w.bahan_baku_id')
			->whereNull('w.deleted_at')
			->whereBetween('w.tanggal_waste', [$start->toDateString(), $end->toDateString()])
			->selectRaw('COALESCE(SUM(w.qty_waste * bb.harga_beli_terakhir), 0) as val')
			->value('val');

		$totalJumlahRecord = (int) DB::table('inventory_manajemen_waste')->whereNull('deleted_at')->whereBetween('tanggal_waste', [$start->toDateString(), $end->toDateString()])->count();

		$byCategory = DB::table('inventory_manajemen_waste as w')
			->join('inventory_bahan_baku as bb', 'bb.id', '=', 'w.bahan_baku_id')
			->whereNull('w.deleted_at')
			->whereBetween('w.tanggal_waste', [$start->toDateString(), $end->toDateString()])
			->selectRaw('COALESCE(w.kategori_waste, "Lainnya") as kategori, COUNT(*) as jumlah, SUM(w.qty_waste) as total_qty, SUM(w.qty_waste * bb.harga_beli_terakhir) as total_nilai')
			->groupBy('w.kategori_waste')
			->orderByDesc('total_nilai')
			->get()
			->map(fn ($r) => ['kategori' => (string) $r->kategori, 'jumlah' => (int) $r->jumlah, 'total_qty' => round((float) $r->total_qty, 3), 'total_nilai' => round((float) $r->total_nilai, 2)])
			->all();

		$topWaste = DB::table('inventory_manajemen_waste as w')
			->join('inventory_bahan_baku as bb', 'bb.id', '=', 'w.bahan_baku_id')
			->whereNull('w.deleted_at')
			->whereBetween('w.tanggal_waste', [$start->toDateString(), $end->toDateString()])
			->selectRaw('bb.nama, bb.satuan, SUM(w.qty_waste) as total_qty, SUM(w.qty_waste * bb.harga_beli_terakhir) as total_nilai')
			->groupBy('bb.id', 'bb.nama', 'bb.satuan')
			->orderByDesc('total_nilai')
			->limit(15)
			->get()
			->map(fn ($r) => ['nama' => (string) $r->nama, 'satuan' => (string) $r->satuan, 'total_qty' => round((float) $r->total_qty, 3), 'total_nilai' => round((float) $r->total_nilai, 2)])
			->all();

		return [
			'filters' => ['period_type' => $nType, 'reference_date' => $nRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'summary' => ['total_record' => $totalJumlahRecord, 'total_qty' => round($totalWasteQty, 3), 'total_nilai_kerugian' => round($wasteValue, 2)],
			'by_category' => $byCategory,
			'top_waste' => $topWaste,
		];
	}

	private function resolvePeriod(string $pt, string $rd, ?string $df, ?string $dt): array
	{
		$allowed = ['daily', 'weekly', 'monthly', 'custom'];
		$n = in_array($pt, $allowed, true) ? $pt : 'daily';
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
			. '<tr><th>Total Record</th><td>' . ($s['total_record'] ?? 0) . '</td></tr>'
			. '<tr><th>Total Qty Waste</th><td>' . ($s['total_qty'] ?? 0) . '</td></tr>'
			. '<tr><th>Nilai Kerugian</th><td>' . $this->formatCurrency((float) ($s['total_nilai_kerugian'] ?? 0)) . '</td></tr>'
			. '</tbody></table>';

		$bc = $report['by_category'] ?? [];
		if (!empty($bc)) {
			$html .= '<div class="section-title">Waste per Kategori</div><table><thead><tr><th>Kategori</th><th style="text-align:right;">Jumlah</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Kerugian</th></tr></thead><tbody>';
			foreach ($bc as $i) { $html .= '<tr><td>' . e($i['kategori']) . '</td><td style="text-align:right;">' . $i['jumlah'] . '</td><td style="text-align:right;">' . $i['total_qty'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_nilai']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		$tw = $report['top_waste'] ?? [];
		if (!empty($tw)) {
			$html .= '<div class="section-title">Top Bahan Terbuang</div><table><thead><tr><th>Bahan</th><th>Satuan</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Kerugian</th></tr></thead><tbody>';
			foreach ($tw as $i) { $html .= '<tr><td>' . e($i['nama']) . '</td><td>' . e($i['satuan']) . '</td><td style="text-align:right;">' . $i['total_qty'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_nilai']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
	}
}
