<?php

namespace App\Modules\Report\LaporanPajak;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LaporanPajakService
{
	public function buildDashboard(string $periodType = 'daily', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
	{
		[$start, $end, $normalizedType, $normalizedReferenceDate] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);
		$limit = max(5, min($limit, 60));

		$baseQuery = DB::table('pos_pesanan')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereNotNull('waktu_bayar')
			->whereBetween('waktu_bayar', [$start->toDateTimeString(), $end->toDateTimeString()]);

		$totalPajak = (float) (clone $baseQuery)->sum('pajak');
		$totalServiceCharge = (float) (clone $baseQuery)->sum('service_charge');
		$totalSubtotal = (float) (clone $baseQuery)->sum('subtotal');
		$totalBruto = (float) (clone $baseQuery)->sum('total');
		$totalTransaksi = (int) (clone $baseQuery)->count();

		$harian = (clone $baseQuery)
			->selectRaw('DATE(waktu_bayar) as tanggal')
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(subtotal), 0) as total_subtotal')
			->selectRaw('COALESCE(SUM(pajak), 0) as total_pajak')
			->selectRaw('COALESCE(SUM(service_charge), 0) as total_service_charge')
			->selectRaw('COALESCE(SUM(total), 0) as total_bruto')
			->groupByRaw('DATE(waktu_bayar)')
			->orderByDesc('tanggal')
			->limit($limit)
			->get()
			->map(fn ($row) => [
				'tanggal' => (string) ($row->tanggal ?? ''),
				'total_transaksi' => (int) ($row->total_transaksi ?? 0),
				'total_subtotal' => (float) ($row->total_subtotal ?? 0),
				'total_pajak' => (float) ($row->total_pajak ?? 0),
				'total_service_charge' => (float) ($row->total_service_charge ?? 0),
				'total_bruto' => (float) ($row->total_bruto ?? 0),
			])
			->values()
			->all();

		return [
			'filters' => [
				'period_type' => $normalizedType,
				'reference_date' => $normalizedReferenceDate,
				'date_from' => $dateFrom,
				'date_to' => $dateTo,
				'effective_range' => [
					'start' => $start->toDateString(),
					'end' => $end->toDateString(),
					'label' => $start->isoFormat('DD MMM YYYY') . ' - ' . $end->isoFormat('DD MMM YYYY'),
				],
			],
			'summary' => [
				'total_transaksi' => $totalTransaksi,
				'total_pajak' => round($totalPajak, 2),
				'total_service_charge' => round($totalServiceCharge, 2),
				'total_subtotal' => round($totalSubtotal, 2),
				'total_bruto' => round($totalBruto, 2),
				'total_titipan' => round($totalPajak + $totalServiceCharge, 2),
				'efektif_persen' => $totalSubtotal > 0 ? round(($totalPajak / $totalSubtotal) * 100, 2) : 0,
			],
			'harian' => $harian,
		];
	}

	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DB::table('pos_pesanan')
			->selectRaw('DATE(waktu_bayar) as tanggal')
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(subtotal), 0) as total_subtotal')
			->selectRaw('COALESCE(SUM(pajak), 0) as total_pajak')
			->selectRaw('COALESCE(SUM(service_charge), 0) as total_service_charge')
			->selectRaw('COALESCE(SUM(total), 0) as total_bruto')
			->selectRaw('CASE
				WHEN COALESCE(SUM(subtotal), 0) > 0
				THEN ROUND((COALESCE(SUM(pajak), 0) / COALESCE(SUM(subtotal), 0)) * 100, 2)
				ELSE 0
			END as efektif_persen')
			->whereNull('deleted_at')
			->where('status', 'paid')
			->whereNotNull('waktu_bayar')
			->when($search !== '', fn ($query) => $query->whereRaw('DATE(waktu_bayar) like ?', ['%' . $search . '%']))
			->groupByRaw('DATE(waktu_bayar)')
			->orderByDesc('tanggal')
			->paginate($perPage)
			->withQueryString();
	}

	public function summary(): array
	{
		$totalPajak = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->sum('pajak');
		$totalSC = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->sum('service_charge');
		$totalSubtotal = (float) DB::table('pos_pesanan')->whereNull('deleted_at')->where('status', 'paid')->sum('subtotal');

		return [
			'total_pajak' => round($totalPajak, 2),
			'total_service_charge' => round($totalSC, 2),
			'total_subtotal' => round($totalSubtotal, 2),
			'total_titipan' => round($totalPajak + $totalSC, 2),
			'efektif_persen' => $totalSubtotal > 0 ? round(($totalPajak / $totalSubtotal) * 100, 2) : 0,
		];
	}

	private function resolvePeriod(string $periodType, string $referenceDate, ?string $dateFrom, ?string $dateTo): array
	{
		$allowed = ['daily', 'weekly', 'monthly', 'custom'];
		$normalizedType = in_array($periodType, $allowed, true) ? $periodType : 'daily';
		$reference = $this->safeParseDate($referenceDate) ?? now();

		if ($normalizedType === 'custom') {
			$start = $this->safeParseDate($dateFrom) ?? $reference->copy()->startOfMonth();
			$end = $this->safeParseDate($dateTo) ?? $reference->copy()->endOfMonth();

			if ($start->gt($end)) {
				[$start, $end] = [$end, $start];
			}

			return [$start->copy()->startOfDay(), $end->copy()->endOfDay(), $normalizedType, $reference->toDateString()];
		}

		if ($normalizedType === 'weekly') {
			return [$reference->copy()->startOfWeek(Carbon::MONDAY), $reference->copy()->endOfWeek(Carbon::SUNDAY), $normalizedType, $reference->toDateString()];
		}

		if ($normalizedType === 'monthly') {
			return [$reference->copy()->startOfMonth(), $reference->copy()->endOfMonth(), $normalizedType, $reference->toDateString()];
		}

		return [$reference->copy()->startOfDay(), $reference->copy()->endOfDay(), 'daily', $reference->toDateString()];
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

