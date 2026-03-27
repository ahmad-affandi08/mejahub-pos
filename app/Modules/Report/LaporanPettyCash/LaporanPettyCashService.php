<?php

namespace App\Modules\Report\LaporanPettyCash;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanPettyCashService
{
	use ReportExportTrait;

	public function buildDashboard(string $periodType = 'daily', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null): array
	{
		[$start, $end, $normType, $normRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);

		$pcIn = (float) DB::table('finance_petty_cash')->whereNull('deleted_at')->where('is_active', true)->where('jenis_arus', 'in')->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])->sum('nominal');
		$pcOut = (float) DB::table('finance_petty_cash')->whereNull('deleted_at')->where('is_active', true)->where('jenis_arus', 'out')->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])->sum('nominal');
		$lastSaldo = DB::table('finance_petty_cash')->whereNull('deleted_at')->where('is_active', true)->orderByDesc('tanggal')->orderByDesc('id')->value('saldo_setelah');
		$expTotal = (float) DB::table('finance_pengeluaran')->whereNull('deleted_at')->where('is_active', true)->where('status_approval', 'approved')->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])->sum('nominal');

		$expByCategory = DB::table('finance_pengeluaran')->whereNull('deleted_at')->where('is_active', true)->where('status_approval', 'approved')->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->selectRaw('kategori_biaya, COUNT(*) as jumlah, COALESCE(SUM(nominal), 0) as total_nominal')
			->groupBy('kategori_biaya')->orderByDesc('total_nominal')->get()
			->map(fn ($r) => ['kategori' => (string) $r->kategori_biaya, 'jumlah' => (int) $r->jumlah, 'total' => (float) $r->total_nominal])->all();

		$pcDetails = DB::table('finance_petty_cash')->whereNull('deleted_at')->where('is_active', true)->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
			->select(['kode', 'tanggal', 'jenis_transaksi', 'jenis_arus', 'nominal', 'saldo_setelah', 'deskripsi'])->orderByDesc('tanggal')->orderByDesc('id')->limit(50)->get()
			->map(fn ($r) => ['kode' => $r->kode, 'tanggal' => $r->tanggal, 'jenis' => $r->jenis_transaksi, 'arus' => $r->jenis_arus, 'nominal' => (float) $r->nominal, 'saldo' => (float) $r->saldo_setelah, 'deskripsi' => $r->deskripsi])->all();

		return [
			'filters' => ['period_type' => $normType, 'reference_date' => $normRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'summary' => ['petty_cash_masuk' => round($pcIn, 2), 'petty_cash_keluar' => round($pcOut, 2), 'saldo_terakhir' => round((float) ($lastSaldo ?? 0), 2), 'total_pengeluaran' => round($expTotal, 2)],
			'expense_by_category' => $expByCategory,
			'petty_cash_details' => $pcDetails,
		];
	}

	public function buildExportTableHtml(array $report): string
	{
		$s = $report['summary'] ?? [];
		$html = '<div class="section-title">Ringkasan</div><table><tbody>'
			. '<tr><th>Petty Cash Masuk</th><td>' . $this->formatCurrency((float) ($s['petty_cash_masuk'] ?? 0)) . '</td></tr>'
			. '<tr><th>Petty Cash Keluar</th><td>' . $this->formatCurrency((float) ($s['petty_cash_keluar'] ?? 0)) . '</td></tr>'
			. '<tr><th>Saldo Terakhir</th><td>' . $this->formatCurrency((float) ($s['saldo_terakhir'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Pengeluaran</th><td>' . $this->formatCurrency((float) ($s['total_pengeluaran'] ?? 0)) . '</td></tr>'
			. '</tbody></table>';

		$ebc = $report['expense_by_category'] ?? [];
		if (!empty($ebc)) {
			$html .= '<div class="section-title">Pengeluaran per Kategori</div><table><thead><tr><th>Kategori</th><th style="text-align:right;">Jumlah</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($ebc as $i) { $html .= '<tr><td>' . e($i['kategori'] ?? '-') . '</td><td style="text-align:right;">' . ($i['jumlah'] ?? 0) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($i['total'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		$pcd = $report['petty_cash_details'] ?? [];
		if (!empty($pcd)) {
			$html .= '<div class="section-title">Riwayat Petty Cash</div><table><thead><tr><th>Kode</th><th>Tanggal</th><th>Arus</th><th style="text-align:right;">Nominal</th><th style="text-align:right;">Saldo</th><th>Deskripsi</th></tr></thead><tbody>';
			foreach ($pcd as $i) { $html .= '<tr><td>' . e($i['kode'] ?? '-') . '</td><td>' . e($i['tanggal'] ?? '-') . '</td><td>' . ($i['arus'] === 'in' ? 'Masuk' : 'Keluar') . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($i['nominal'] ?? 0)) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($i['saldo'] ?? 0)) . '</td><td>' . e($i['deskripsi'] ?? '-') . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
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
}
