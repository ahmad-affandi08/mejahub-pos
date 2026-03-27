<?php

namespace App\Modules\Report\LaporanVoidRefund;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanVoidRefundService
{
	use ReportExportTrait;

	public function buildDashboard(string $periodType = 'monthly', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null): array
	{
		[$start, $end, $nType, $nRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);

		$totalVoid = (int) DB::table('pos_void_pesanan')->whereNull('deleted_at')->whereBetween('voided_at', [$start->toDateTimeString(), $end->toDateTimeString()])->count();
		$totalRefund = (int) DB::table('pos_refund_pesanan')->whereNull('deleted_at')->whereBetween('refunded_at', [$start->toDateTimeString(), $end->toDateTimeString()])->count();
		$totalRefundNominal = (float) DB::table('pos_refund_pesanan')->whereNull('deleted_at')->whereBetween('refunded_at', [$start->toDateTimeString(), $end->toDateTimeString()])->sum('nominal');
		$totalTx = (int) DB::table('pos_pembayaran')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->count();
		$voidRate = $totalTx > 0 ? round(($totalVoid / $totalTx) * 100, 2) : 0;

		$voidPerKasir = DB::table('pos_void_pesanan as v')
			->leftJoin('users as u', 'u.id', '=', 'v.user_id')
			->whereNull('v.deleted_at')
			->whereBetween('v.voided_at', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('COALESCE(u.name, "Unknown") as kasir, COUNT(*) as jumlah_void')
			->groupBy('u.name')
			->orderByDesc('jumlah_void')
			->get()
			->map(fn ($r) => ['kasir' => (string) $r->kasir, 'jumlah_void' => (int) $r->jumlah_void])
			->all();

		$refundPerKasir = DB::table('pos_refund_pesanan as r')
			->leftJoin('users as u', 'u.id', '=', 'r.user_id')
			->whereNull('r.deleted_at')
			->whereBetween('r.refunded_at', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('COALESCE(u.name, "Unknown") as kasir, COUNT(*) as jumlah_refund, COALESCE(SUM(r.nominal), 0) as total_nominal')
			->groupBy('u.name')
			->orderByDesc('total_nominal')
			->get()
			->map(fn ($r) => ['kasir' => (string) $r->kasir, 'jumlah_refund' => (int) $r->jumlah_refund, 'total_nominal' => round((float) $r->total_nominal, 2)])
			->all();

		$topAlasanVoid = DB::table('pos_void_pesanan')
			->whereNull('deleted_at')
			->whereBetween('voided_at', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('alasan, COUNT(*) as jumlah')
			->groupBy('alasan')
			->orderByDesc('jumlah')
			->limit(10)
			->get()
			->map(fn ($r) => ['alasan' => (string) ($r->alasan ?: 'Tanpa alasan'), 'jumlah' => (int) $r->jumlah])
			->all();

		return [
			'filters' => ['period_type' => $nType, 'reference_date' => $nRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'summary' => ['total_void' => $totalVoid, 'total_refund' => $totalRefund, 'total_refund_nominal' => round($totalRefundNominal, 2), 'total_transaksi' => $totalTx, 'void_rate' => $voidRate],
			'void_per_kasir' => $voidPerKasir,
			'refund_per_kasir' => $refundPerKasir,
			'top_alasan_void' => $topAlasanVoid,
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
			. '<tr><th>Total Void</th><td>' . ($s['total_void'] ?? 0) . '</td></tr>'
			. '<tr><th>Total Refund</th><td>' . ($s['total_refund'] ?? 0) . '</td></tr>'
			. '<tr><th>Nominal Refund</th><td>' . $this->formatCurrency((float) ($s['total_refund_nominal'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Transaksi</th><td>' . ($s['total_transaksi'] ?? 0) . '</td></tr>'
			. '<tr><th>Void Rate</th><td>' . ($s['void_rate'] ?? 0) . '%</td></tr>'
			. '</tbody></table>';

		$vk = $report['void_per_kasir'] ?? [];
		if (!empty($vk)) {
			$html .= '<div class="section-title">Void per Kasir</div><table><thead><tr><th>Kasir</th><th style="text-align:right;">Jumlah Void</th></tr></thead><tbody>';
			foreach ($vk as $i) { $html .= '<tr><td>' . e($i['kasir']) . '</td><td style="text-align:right;">' . $i['jumlah_void'] . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		$rk = $report['refund_per_kasir'] ?? [];
		if (!empty($rk)) {
			$html .= '<div class="section-title">Refund per Kasir</div><table><thead><tr><th>Kasir</th><th style="text-align:right;">Jumlah</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($rk as $i) { $html .= '<tr><td>' . e($i['kasir']) . '</td><td style="text-align:right;">' . $i['jumlah_refund'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_nominal']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		$ta = $report['top_alasan_void'] ?? [];
		if (!empty($ta)) {
			$html .= '<div class="section-title">Top Alasan Void</div><table><thead><tr><th>Alasan</th><th style="text-align:right;">Jumlah</th></tr></thead><tbody>';
			foreach ($ta as $i) { $html .= '<tr><td>' . e($i['alasan']) . '</td><td style="text-align:right;">' . $i['jumlah'] . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
	}
}
