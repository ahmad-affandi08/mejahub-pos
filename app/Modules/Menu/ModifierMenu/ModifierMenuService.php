<?php

namespace App\Modules\Menu\ModifierMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ModifierMenuService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return ModifierMenuEntity::query()
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

	public function create(array $payload): ModifierMenuEntity
	{
		return ModifierMenuEntity::create($payload);
	}

	public function update(int $id, array $payload): ModifierMenuEntity
	{
		$item = ModifierMenuEntity::query()->findOrFail($id);
		$item->update($payload);

		return $item->refresh();
	}

	public function delete(int $id): void
	{
		$item = ModifierMenuEntity::query()->findOrFail($id);
		$item->delete();
	}
}
