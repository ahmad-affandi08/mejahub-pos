<?php

namespace App\Modules\CRM\PoinLoyalty;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PoinLoyaltyService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		$customerExpr = "COALESCE(NULLIF(TRIM(nama_pelanggan), ''), 'Walk-in')";

		return DB::table('pos_pesanan')
			->selectRaw("{$customerExpr} as nama_pelanggan")
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(total), 0) as total_belanja')
			->selectRaw('FLOOR(COALESCE(SUM(total), 0) / 10000) as poin_terkumpul')
			->selectRaw('FLOOR(COALESCE(SUM(total), 0) / 50000) as estimasi_poin_terpakai')
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
			->orderByDesc('poin_terkumpul')
			->paginate($perPage)
			->withQueryString();
	}
}
