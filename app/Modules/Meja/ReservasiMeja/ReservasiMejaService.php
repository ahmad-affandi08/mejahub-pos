<?php

namespace App\Modules\Meja\ReservasiMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReservasiMejaService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return ReservasiMejaEntity::query()
			->with('meja:id,nama,nomor_meja')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('nama_pelanggan', 'like', '%' . $search . '%')
					->orWhere('kode', 'like', '%' . $search . '%')
					->orWhere('no_hp', 'like', '%' . $search . '%');
			})
			->orderByDesc('waktu_reservasi')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): ReservasiMejaEntity
	{
		return ReservasiMejaEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): ReservasiMejaEntity
	{
		$item = ReservasiMejaEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = ReservasiMejaEntity::query()->findOrFail($id);
		$item->delete();
	}
}
