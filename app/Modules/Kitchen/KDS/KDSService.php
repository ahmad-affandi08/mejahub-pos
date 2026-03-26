<?php

namespace App\Modules\Kitchen\KDS;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class KDSService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DB::table('pos_pesanan as pesanan')
			->leftJoin('pos_pesanan_item as item', function ($join) {
				$join->on('item.pesanan_id', '=', 'pesanan.id')
					->whereNull('item.deleted_at');
			})
			->leftJoin('data_meja as meja', function ($join) {
				$join->on('meja.id', '=', 'pesanan.data_meja_id')
					->whereNull('meja.deleted_at');
			})
			->select([
				'pesanan.id',
				'pesanan.kode',
				'pesanan.nama_pelanggan',
				'pesanan.status',
				'pesanan.waktu_pesan',
				'meja.nama as nama_meja',
				'meja.nomor_meja',
			])
			->selectRaw('COUNT(item.id) as total_item')
			->selectRaw('COALESCE(SUM(item.qty), 0) as total_qty')
			->whereNull('pesanan.deleted_at')
			->whereIn('pesanan.status', ['draft', 'submitted'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('pesanan.kode', 'like', '%' . $search . '%')
						->orWhere('pesanan.nama_pelanggan', 'like', '%' . $search . '%')
						->orWhere('item.nama_menu', 'like', '%' . $search . '%')
						->orWhere('meja.nama', 'like', '%' . $search . '%');
				});
			})
			->groupBy([
				'pesanan.id',
				'pesanan.kode',
				'pesanan.nama_pelanggan',
				'pesanan.status',
				'pesanan.waktu_pesan',
				'meja.nama',
				'meja.nomor_meja',
			])
			->orderBy('pesanan.waktu_pesan')
			->paginate($perPage)
			->withQueryString();
	}
}
