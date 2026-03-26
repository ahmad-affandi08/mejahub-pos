<?php

namespace App\Modules\Kitchen\StatusMasak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StatusMasakService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DB::table('pos_pesanan_item as item')
			->join('pos_pesanan as pesanan', 'pesanan.id', '=', 'item.pesanan_id')
			->select([
				'item.id',
				'pesanan.kode as kode_pesanan',
				'pesanan.nama_pelanggan',
				'pesanan.status as status_pesanan',
				'item.nama_menu',
				'item.qty',
				'pesanan.waktu_pesan',
			])
			->selectRaw("CASE
				WHEN pesanan.status = 'paid' THEN 'ready'
				WHEN pesanan.status = 'submitted' THEN 'cooking'
				ELSE 'queued'
			END as status_masak")
			->whereNull('item.deleted_at')
			->whereNull('pesanan.deleted_at')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('pesanan.kode', 'like', '%' . $search . '%')
						->orWhere('pesanan.nama_pelanggan', 'like', '%' . $search . '%')
						->orWhere('item.nama_menu', 'like', '%' . $search . '%');
				});
			})
			->orderByDesc('item.id')
			->paginate($perPage)
			->withQueryString();
	}
}
