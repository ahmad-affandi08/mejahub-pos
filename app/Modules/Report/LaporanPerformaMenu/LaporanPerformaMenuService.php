<?php

namespace App\Modules\Report\LaporanPerformaMenu;

use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanPerformaMenuService
{
	use ReportExportTrait;

	public function buildDashboard(string $periodType = 'daily', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null, int $topLimit = 10): array
	{
		[$start, $end, $nType, $nRef] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);
		$topLimit = max(3, min($topLimit, 25));

		$bestSellers = $this->bestSellers($start, $end, $topLimit);
		$deadStock = $this->deadStock($start, $end, 5);
		$ticketSize = $this->avgTicketSize($start, $end);
		$diskon = $this->diskonAnalysis($start, $end);

		return [
			'filters' => ['period_type' => $nType, 'reference_date' => $nRef, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'top_limit' => $topLimit, 'effective_range' => ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY')]],
			'best_sellers' => $bestSellers,
			'dead_stock' => $deadStock,
			'ticket_size' => $ticketSize,
			'diskon' => $diskon,
		];
	}

	private function bestSellers(Carbon $start, Carbon $end, int $limit): array
	{
		return DB::table('pos_pesanan_item as pi')
			->join('pos_pesanan as p', 'p.id', '=', 'pi.pesanan_id')
			->leftJoin(DB::raw('(SELECT bom.data_menu_id, COALESCE(SUM(bom.qty_kebutuhan * bb.harga_beli_terakhir), 0) as hpp_per_porsi FROM inventory_resep_bom bom JOIN inventory_bahan_baku bb ON bb.id = bom.bahan_baku_id WHERE bom.is_active = 1 AND bom.deleted_at IS NULL GROUP BY bom.data_menu_id) as hpp_calc'), 'hpp_calc.data_menu_id', '=', 'pi.data_menu_id')
			->whereNull('pi.deleted_at')->whereNull('p.deleted_at')
			->where('p.status', 'paid')
			->whereBetween('p.waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('pi.nama_menu, SUM(pi.qty) as total_qty, SUM(pi.subtotal) as total_revenue, COALESCE(hpp_calc.hpp_per_porsi, 0) as hpp_per_porsi, SUM(pi.qty) * COALESCE(hpp_calc.hpp_per_porsi, 0) as total_hpp')
			->groupBy('pi.nama_menu', 'pi.data_menu_id', 'hpp_calc.hpp_per_porsi')
			->orderByDesc('total_qty')
			->limit($limit)
			->get()
			->map(function ($row) {
				$revenue = (float) $row->total_revenue;
				$hpp = (float) $row->total_hpp;
				$margin = $revenue - $hpp;
				$marginPersen = $revenue > 0 ? ($margin / $revenue) * 100 : 0;
				return [
					'nama_menu' => (string) $row->nama_menu,
					'total_qty' => (int) $row->total_qty,
					'total_revenue' => round($revenue, 2),
					'total_hpp' => round($hpp, 2),
					'margin' => round($margin, 2),
					'margin_persen' => round($marginPersen, 2),
				];
			})->all();
	}

	private function deadStock(Carbon $start, Carbon $end, int $limit): array
	{
		return DB::table('pos_pesanan_item as pi')
			->join('pos_pesanan as p', 'p.id', '=', 'pi.pesanan_id')
			->whereNull('pi.deleted_at')->whereNull('p.deleted_at')
			->where('p.status', 'paid')
			->whereBetween('p.waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])
			->selectRaw('pi.nama_menu, SUM(pi.qty) as total_qty, SUM(pi.subtotal) as total_revenue')
			->groupBy('pi.nama_menu')
			->orderBy('total_qty')
			->limit($limit)
			->get()
			->map(fn ($row) => [
				'nama_menu' => (string) $row->nama_menu,
				'total_qty' => (int) $row->total_qty,
				'total_revenue' => round((float) $row->total_revenue, 2),
			])->all();
	}

	private function avgTicketSize(Carbon $start, Carbon $end): array
	{
		$totalRevenue = (float) PembayaranEntity::query()->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->sum('nominal_tagihan');
		$totalTx = (int) PembayaranEntity::query()->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->count();

		return [
			'total_revenue' => round($totalRevenue, 2),
			'total_transaksi' => $totalTx,
			'avg_ticket' => $totalTx > 0 ? round($totalRevenue / $totalTx, 2) : 0,
		];
	}

	private function diskonAnalysis(Carbon $start, Carbon $end): array
	{
		$totalDiskon = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->sum('diskon');
		$txWithDiskon = (int) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->where('diskon', '>', 0)->count();
		$txTotal = (int) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->count();
		$revenueWithDiskon = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->where('diskon', '>', 0)->sum('total');
		$revenueNoDiskon = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()])->where('diskon', '<=', 0)->sum('total');

		return [
			'total_diskon' => round($totalDiskon, 2),
			'transaksi_dengan_diskon' => $txWithDiskon,
			'transaksi_total' => $txTotal,
			'persen_tx_diskon' => $txTotal > 0 ? round(($txWithDiskon / $txTotal) * 100, 2) : 0,
			'revenue_dengan_diskon' => round($revenueWithDiskon, 2),
			'revenue_tanpa_diskon' => round($revenueNoDiskon, 2),
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
		$bs = $report['best_sellers'] ?? [];
		$ds = $report['dead_stock'] ?? [];
		$ts = $report['ticket_size'] ?? [];
		$dk = $report['diskon'] ?? [];

		$html = '<div class="section-title">Ringkasan</div><table><tbody>'
			. '<tr><th>Avg Ticket Size</th><td>' . $this->formatCurrency((float) ($ts['avg_ticket'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Transaksi</th><td>' . ($ts['total_transaksi'] ?? 0) . '</td></tr>'
			. '<tr><th>Total Diskon</th><td>' . $this->formatCurrency((float) ($dk['total_diskon'] ?? 0)) . '</td></tr>'
			. '<tr><th>% Tx Pakai Diskon</th><td>' . number_format((float) ($dk['persen_tx_diskon'] ?? 0), 2) . '%</td></tr>'
			. '</tbody></table>';

		if (!empty($bs)) {
			$html .= '<div class="section-title">Best Seller + Margin</div><table><thead><tr><th>Menu</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Revenue</th><th style="text-align:right;">HPP</th><th style="text-align:right;">Margin</th><th style="text-align:right;">Margin %</th></tr></thead><tbody>';
			foreach ($bs as $i) { $html .= '<tr><td>' . e($i['nama_menu']) . '</td><td style="text-align:right;">' . $i['total_qty'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_revenue']) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_hpp']) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['margin']) . '</td><td style="text-align:right;">' . number_format($i['margin_persen'], 2) . '%</td></tr>'; }
			$html .= '</tbody></table>';
		}

		if (!empty($ds)) {
			$html .= '<div class="section-title">Dead Stock</div><table><thead><tr><th>Menu</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Revenue</th></tr></thead><tbody>';
			foreach ($ds as $i) { $html .= '<tr><td>' . e($i['nama_menu']) . '</td><td style="text-align:right;">' . $i['total_qty'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) $i['total_revenue']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
	}
}
