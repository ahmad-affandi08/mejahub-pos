<?php

namespace App\Modules\Report\LaporanPajak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LaporanPajakService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DB::table('pos_pesanan')
			->selectRaw('DATE(waktu_bayar) as tanggal')
			->selectRaw('COUNT(*) as total_transaksi')
			->selectRaw('COALESCE(SUM(subtotal), 0) as total_subtotal')
			->selectRaw('COALESCE(SUM(pajak), 0) as total_pajak')
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
}
