<?php

namespace App\Modules\Settings\ProfilToko;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProfilTokoService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return ProfilTokoEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama_toko', 'like', '%' . $search . '%')
						->orWhere('nama_brand', 'like', '%' . $search . '%')
						->orWhere('kode_toko', 'like', '%' . $search . '%')
						->orWhere('telepon', 'like', '%' . $search . '%')
						->orWhere('email', 'like', '%' . $search . '%');
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): ProfilTokoEntity
	{
		if (($payload['is_default'] ?? false) === true) {
			ProfilTokoEntity::query()->update(['is_default' => false]);
		}

		return ProfilTokoEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): ProfilTokoEntity
	{
		$entity = ProfilTokoEntity::query()->findOrFail($id);

		if (($payload['is_default'] ?? false) === true) {
			ProfilTokoEntity::query()
				->where('id', '!=', $entity->id)
				->update(['is_default' => false]);
		}

		$entity->update($payload);

		return $entity->refresh();
	}

	public function delete(int $id): void
	{
		$entity = ProfilTokoEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
