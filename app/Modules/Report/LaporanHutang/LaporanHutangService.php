<?php

namespace App\Modules\Report\LaporanHutang;

use App\Support\ReportExportTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanHutangService
{
	use ReportExportTrait;

	public function buildDashboard(): array
	{
		$today = Carbon::today();
		$endOfWeek = $today->copy()->endOfWeek(Carbon::SUNDAY);

		$totalHutang = (float) DB::table('finance_hutang')->whereNull('deleted_at')->where('status', '!=', 'paid')->sum('sisa_hutang');
		$totalLunas = (float) DB::table('finance_hutang')->whereNull('deleted_at')->where('status', 'paid')->sum('nominal_hutang');
		$jatuhTempoMingguIni = (float) DB::table('finance_hutang')->whereNull('deleted_at')->where('status', '!=', 'paid')->whereBetween('jatuh_tempo', [$today->toDateString(), $endOfWeek->toDateString()])->sum('sisa_hutang');
		$overdue = (float) DB::table('finance_hutang')->whereNull('deleted_at')->where('status', '!=', 'paid')->where('jatuh_tempo', '<', $today->toDateString())->sum('sisa_hutang');

		$aging = $this->agingSchedule($today);
		$perSupplier = $this->perSupplier();
		$recentDue = $this->recentDue($today);

		return [
			'filters' => ['period_type' => 'all', 'effective_range' => ['start' => $today->toDateString(), 'end' => $today->toDateString(), 'label' => 'Snapshot ' . $today->isoFormat('DD MMM YYYY')]],
			'summary' => [
				'total_hutang' => round($totalHutang, 2),
				'total_lunas' => round($totalLunas, 2),
				'jatuh_tempo_minggu_ini' => round($jatuhTempoMingguIni, 2),
				'overdue' => round($overdue, 2),
			],
			'aging' => $aging,
			'per_supplier' => $perSupplier,
			'recent_due' => $recentDue,
		];
	}

	private function agingSchedule(Carbon $today): array
	{
		$base = DB::table('finance_hutang')->whereNull('deleted_at')->where('status', '!=', 'paid');
		$current = (float) (clone $base)->where('jatuh_tempo', '>=', $today->toDateString())->sum('sisa_hutang');
		$d1_30 = (float) (clone $base)->whereBetween('jatuh_tempo', [$today->copy()->subDays(30)->toDateString(), $today->copy()->subDay()->toDateString()])->sum('sisa_hutang');
		$d31_60 = (float) (clone $base)->whereBetween('jatuh_tempo', [$today->copy()->subDays(60)->toDateString(), $today->copy()->subDays(31)->toDateString()])->sum('sisa_hutang');
		$d60plus = (float) (clone $base)->where('jatuh_tempo', '<', $today->copy()->subDays(60)->toDateString())->sum('sisa_hutang');

		return [
			['label' => 'Belum Jatuh Tempo', 'nominal' => round($current, 2)],
			['label' => '1 - 30 Hari', 'nominal' => round($d1_30, 2)],
			['label' => '31 - 60 Hari', 'nominal' => round($d31_60, 2)],
			['label' => '> 60 Hari', 'nominal' => round($d60plus, 2)],
		];
	}

	private function perSupplier(): array
	{
		return DB::table('finance_hutang as h')
			->leftJoin('inventory_supplier as s', 's.id', '=', 'h.supplier_id')
			->whereNull('h.deleted_at')->where('h.status', '!=', 'paid')
			->selectRaw('COALESCE(s.nama, "Supplier Tidak Diketahui") as supplier_nama, COUNT(*) as jumlah_tagihan, COALESCE(SUM(h.sisa_hutang), 0) as total_sisa')
			->groupBy('s.nama')->orderByDesc('total_sisa')->limit(20)->get()
			->map(fn ($row) => ['supplier' => (string) $row->supplier_nama, 'jumlah_tagihan' => (int) $row->jumlah_tagihan, 'total_sisa' => (float) $row->total_sisa])->all();
	}

	private function recentDue(Carbon $today): array
	{
		return DB::table('finance_hutang as h')
			->leftJoin('inventory_supplier as s', 's.id', '=', 'h.supplier_id')
			->whereNull('h.deleted_at')->where('h.status', '!=', 'paid')
			->where('h.jatuh_tempo', '<=', $today->copy()->addDays(7)->toDateString())
			->select(['h.kode', 'h.jatuh_tempo', 'h.sisa_hutang', 'h.status', 's.nama as supplier_nama'])
			->orderBy('h.jatuh_tempo')->limit(20)->get()
			->map(fn ($row) => ['kode' => (string) $row->kode, 'supplier' => (string) ($row->supplier_nama ?? '-'), 'jatuh_tempo' => (string) $row->jatuh_tempo, 'sisa_hutang' => (float) $row->sisa_hutang, 'status' => (string) $row->status, 'is_overdue' => Carbon::parse($row->jatuh_tempo)->lt($today)])->all();
	}

	public function buildExportTableHtml(array $report): string
	{
		$s = $report['summary'] ?? [];
		$aging = $report['aging'] ?? [];
		$perSupplier = $report['per_supplier'] ?? [];
		$recentDue = $report['recent_due'] ?? [];

		$html = '<div class="section-title">Ringkasan Hutang</div>'
			. '<table><tbody>'
			. '<tr><th>Total Hutang Aktif</th><td>' . $this->formatCurrency((float) ($s['total_hutang'] ?? 0)) . '</td></tr>'
			. '<tr><th>Jatuh Tempo Minggu Ini</th><td>' . $this->formatCurrency((float) ($s['jatuh_tempo_minggu_ini'] ?? 0)) . '</td></tr>'
			. '<tr><th>Overdue</th><td>' . $this->formatCurrency((float) ($s['overdue'] ?? 0)) . '</td></tr>'
			. '<tr><th>Total Lunas</th><td>' . $this->formatCurrency((float) ($s['total_lunas'] ?? 0)) . '</td></tr>'
			. '</tbody></table>';

		if (!empty($aging)) {
			$html .= '<div class="section-title">Aging Schedule</div><table><thead><tr><th>Kategori</th><th style="text-align:right;">Nominal</th></tr></thead><tbody>';
			foreach ($aging as $item) { $html .= '<tr><td>' . e($item['label']) . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['nominal'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		if (!empty($perSupplier)) {
			$html .= '<div class="section-title">Hutang Per Supplier</div><table><thead><tr><th>Supplier</th><th style="text-align:right;">Tagihan</th><th style="text-align:right;">Sisa Hutang</th></tr></thead><tbody>';
			foreach ($perSupplier as $item) { $html .= '<tr><td>' . e($item['supplier']) . '</td><td style="text-align:right;">' . $item['jumlah_tagihan'] . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['total_sisa'] ?? 0)) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		if (!empty($recentDue)) {
			$html .= '<div class="section-title">Segera Jatuh Tempo (7 Hari)</div><table><thead><tr><th>Kode</th><th>Supplier</th><th>Jatuh Tempo</th><th style="text-align:right;">Sisa</th><th>Status</th></tr></thead><tbody>';
			foreach ($recentDue as $item) { $html .= '<tr><td>' . e($item['kode']) . '</td><td>' . e($item['supplier']) . '</td><td>' . e($item['jatuh_tempo']) . ($item['is_overdue'] ? ' (OVERDUE)' : '') . '</td><td style="text-align:right;">' . $this->formatCurrency((float) ($item['sisa_hutang'] ?? 0)) . '</td><td>' . e($item['status']) . '</td></tr>'; }
			$html .= '</tbody></table>';
		}

		return $html;
	}
}
