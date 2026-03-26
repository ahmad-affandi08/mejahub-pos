<?php

namespace App\Modules\Report\LaporanShift;

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
}
