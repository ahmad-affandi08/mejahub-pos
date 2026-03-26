<?php

namespace App\Modules\Settings\KonfigurasiPajak;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KonfigurasiPajakService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return KonfigurasiPajakEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('jenis', 'like', '%' . $search . '%')
						->orWhere('applies_to', 'like', '%' . $search . '%');
				});
			})
			->orderByDesc('is_default')
			->orderBy('urutan')
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): KonfigurasiPajakEntity
	{
		if (($payload['is_default'] ?? false) === true) {
			KonfigurasiPajakEntity::query()->update(['is_default' => false]);
		}

		return KonfigurasiPajakEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): KonfigurasiPajakEntity
	{
		$entity = KonfigurasiPajakEntity::query()->findOrFail($id);

		if (($payload['is_default'] ?? false) === true) {
			KonfigurasiPajakEntity::query()
				->where('id', '!=', $entity->id)
				->update(['is_default' => false]);
		}

		$entity->update($payload);

		return $entity->refresh();
	}

	public function delete(int $id): void
	{
		$entity = KonfigurasiPajakEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
