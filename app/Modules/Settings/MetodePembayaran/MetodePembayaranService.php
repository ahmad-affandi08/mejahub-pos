<?php

namespace App\Modules\Settings\MetodePembayaran;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MetodePembayaranService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return MetodePembayaranEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('tipe', 'like', '%' . $search . '%')
						->orWhere('provider', 'like', '%' . $search . '%');
				});
			})
			->orderByDesc('is_default')
			->orderBy('urutan')
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): MetodePembayaranEntity
	{
		if (($payload['is_default'] ?? false) === true) {
			MetodePembayaranEntity::query()->update(['is_default' => false]);
		}

		return MetodePembayaranEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): MetodePembayaranEntity
	{
		$entity = MetodePembayaranEntity::query()->findOrFail($id);

		if (($payload['is_default'] ?? false) === true) {
			MetodePembayaranEntity::query()
				->where('id', '!=', $entity->id)
				->update(['is_default' => false]);
		}

		$entity->update($payload);

		return $entity->refresh();
	}

	public function delete(int $id): void
	{
		$entity = MetodePembayaranEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
