<?php

namespace App\Modules\CRM\DataPelanggan;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DataPelangganService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		$customerExpr = "COALESCE(NULLIF(TRIM(nama_pelanggan), ''), 'Walk-in')";

		return DB::table('pos_pesanan')
			->selectRaw("{$customerExpr} as nama_pelanggan")
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(total), 0) as total_belanja')
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
			->orderByDesc('terakhir_transaksi')
			->paginate($perPage)
			->withQueryString();
	}
}
