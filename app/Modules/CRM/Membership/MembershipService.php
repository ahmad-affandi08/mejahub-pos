<?php

namespace App\Modules\CRM\Membership;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MembershipService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		$customerExpr = "COALESCE(NULLIF(TRIM(nama_pelanggan), ''), 'Walk-in')";

		return DB::table('pos_pesanan')
			->selectRaw("{$customerExpr} as nama_pelanggan")
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(total), 0) as total_belanja')
			->selectRaw('COALESCE(AVG(total), 0) as rata_rata_transaksi')
			->selectRaw("CASE
				WHEN COALESCE(SUM(total), 0) >= 5000000 THEN 'Gold'
				WHEN COALESCE(SUM(total), 0) >= 2000000 THEN 'Silver'
				WHEN COALESCE(SUM(total), 0) >= 500000 THEN 'Bronze'
				ELSE 'Basic'
			END as tier")
			->selectRaw('MAX(waktu_pesan) as terakhir_transaksi')
			->whereNull('deleted_at')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama_pelanggan', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%');
				});
			})
			->groupBy(DB::raw($customerExpr))
			->orderByDesc('total_belanja')
			->paginate($perPage)
			->withQueryString();
	}
}
