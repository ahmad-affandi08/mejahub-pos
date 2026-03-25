<?php

namespace App\Modules\Meja\AreaMeja;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AreaMejaService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return AreaMejaEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('nama', 'like', '%' . $search . '%')
					->orWhere('kode', 'like', '%' . $search . '%');
			})
			->orderBy('urutan')
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): AreaMejaEntity
	{
		return AreaMejaEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): AreaMejaEntity
	{
		$item = AreaMejaEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = AreaMejaEntity::query()->findOrFail($id);
		$item->delete();
	}
}
