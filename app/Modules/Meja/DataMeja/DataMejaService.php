<?php

namespace App\Modules\Meja\DataMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DataMejaService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DataMejaEntity::query()
			->with('area:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('nama', 'like', '%' . $search . '%')
					->orWhere('kode', 'like', '%' . $search . '%')
					->orWhere('nomor_meja', 'like', '%' . $search . '%');
			})
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): DataMejaEntity
	{
		return DataMejaEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): DataMejaEntity
	{
		$item = DataMejaEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = DataMejaEntity::query()->findOrFail($id);
		$item->delete();
	}
}
