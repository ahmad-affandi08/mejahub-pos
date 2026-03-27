<?php

namespace App\Modules\Report\LaporanShift;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LaporanShiftService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DB::table('pos_shift as shift')
			->leftJoin('users as kasir', 'kasir.id', '=', 'shift.user_id')
			->leftJoin('pos_pembayaran as bayar', function ($join) {
				$join->on('bayar.shift_id', '=', 'shift.id')
					->whereNull('bayar.deleted_at');
			})
			->select([
				'shift.id',
				'shift.kode',
				'shift.status',
				'shift.waktu_buka',
				'shift.waktu_tutup',
				'shift.kas_awal',
				'shift.kas_aktual',
				'shift.kas_sistem',
				'shift.selisih',
				'shift.jumlah_transaksi',
				'kasir.name as kasir_nama',
			])
			->selectRaw('COUNT(bayar.id) as total_pembayaran')
			->selectRaw('COALESCE(SUM(bayar.nominal_tagihan), 0) as total_penjualan')
			->whereNull('shift.deleted_at')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('shift.kode', 'like', '%' . $search . '%')
						->orWhere('shift.status', 'like', '%' . $search . '%')
						->orWhere('kasir.name', 'like', '%' . $search . '%');
				});
			})
			->groupBy([
				'shift.id',
				'shift.kode',
				'shift.status',
				'shift.waktu_buka',
				'shift.waktu_tutup',
				'shift.kas_awal',
				'shift.kas_aktual',
				'shift.kas_sistem',
				'shift.selisih',
				'shift.jumlah_transaksi',
				'kasir.name',
			])
			->orderByDesc('shift.waktu_buka')
			->paginate($perPage)
			->withQueryString();
	}

	public function buildDashboard(string $periodType = 'daily', string $referenceDate = '', ?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
	{
		[$start, $end, $normalizedType, $normalizedReferenceDate] = $this->resolvePeriod($periodType, $referenceDate, $dateFrom, $dateTo);
		$limit = max(5, min($limit, 30));

		$rows = DB::table('pos_shift as shift')
			->leftJoin('users as kasir', 'kasir.id', '=', 'shift.user_id')
			->leftJoin('pos_pembayaran as bayar', function ($join) {
				$join->on('bayar.shift_id', '=', 'shift.id')
					->whereNull('bayar.deleted_at')
					->where('bayar.status', 'paid');
			})
			->select([
				'shift.id',
				'shift.kode',
				'shift.status',
				'shift.waktu_buka',
				'shift.waktu_tutup',
				'shift.kas_awal',
				'shift.kas_aktual',
				'shift.kas_sistem',
				'shift.selisih',
				'shift.jumlah_transaksi',
				'kasir.name as kasir_nama',
			])
			->selectRaw('COUNT(bayar.id) as total_pembayaran')
			->selectRaw('COALESCE(SUM(bayar.nominal_tagihan), 0) as total_penjualan')
			->whereNull('shift.deleted_at')
			->whereBetween('shift.waktu_buka', [$start->toDateTimeString(), $end->toDateTimeString()])
			->groupBy([
				'shift.id',
				'shift.kode',
				'shift.status',
				'shift.waktu_buka',
				'shift.waktu_tutup',
				'shift.kas_awal',
				'shift.kas_aktual',
				'shift.kas_sistem',
				'shift.selisih',
				'shift.jumlah_transaksi',
				'kasir.name',
			])
			->orderByDesc('shift.waktu_buka')
			->limit($limit)
			->get()
			->map(fn ($row) => [
				'id' => (int) $row->id,
				'kode' => (string) ($row->kode ?? '-'),
				'status' => (string) ($row->status ?? '-'),
				'waktu_buka' => (string) ($row->waktu_buka ?? ''),
				'waktu_tutup' => (string) ($row->waktu_tutup ?? ''),
				'kasir_nama' => (string) ($row->kasir_nama ?? '-'),
				'kas_awal' => (float) ($row->kas_awal ?? 0),
				'kas_sistem' => (float) ($row->kas_sistem ?? 0),
				'kas_aktual' => (float) ($row->kas_aktual ?? 0),
				'selisih' => (float) ($row->selisih ?? 0),
				'jumlah_transaksi' => (int) ($row->jumlah_transaksi ?? 0),
				'total_pembayaran' => (int) ($row->total_pembayaran ?? 0),
				'total_penjualan' => (float) ($row->total_penjualan ?? 0),
			])
			->values()
			->all();

		$summary = [
			'total_shift' => count($rows),
			'shift_open' => collect($rows)->where('status', 'open')->count(),
			'shift_closed' => collect($rows)->where('status', 'closed')->count(),
			'total_transaksi' => (int) collect($rows)->sum('jumlah_transaksi'),
			'total_penjualan' => (float) collect($rows)->sum('total_penjualan'),
			'total_selisih_kas' => (float) collect($rows)->sum('selisih'),
		];

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
			'summary' => $summary,
			'shifts' => $rows,
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
