<?php

namespace App\Modules\Menu\VarianMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class VarianMenuService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return VarianMenuEntity::query()
			->with('dataMenu:id,nama')
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

	public function create(array $payload): VarianMenuEntity
	{
		return VarianMenuEntity::create($payload);
	}

	public function update(int $id, array $payload): VarianMenuEntity
	{
		$item = VarianMenuEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = VarianMenuEntity::query()->findOrFail($id);
		$item->delete();
	}
}
