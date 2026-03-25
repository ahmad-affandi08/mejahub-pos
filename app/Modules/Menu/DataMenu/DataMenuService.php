<?php

namespace App\Modules\Menu\DataMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DataMenuService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return DataMenuEntity::query()
			->with('kategori:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('nama', 'like', '%' . $search . '%')
					->orWhere('kode', 'like', '%' . $search . '%');
			})
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): DataMenuEntity
	{
		return DataMenuEntity::create($payload);
	}

	public function update(int $id, array $payload): DataMenuEntity
	{
		$item = DataMenuEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = DataMenuEntity::query()->findOrFail($id);
		$item->delete();
	}
}
