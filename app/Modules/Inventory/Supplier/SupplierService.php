<?php

namespace App\Modules\Inventory\Supplier;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SupplierService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return SupplierEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('telepon', 'like', '%' . $search . '%')
						->orWhere('email', 'like', '%' . $search . '%');
				});
			})
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): SupplierEntity
	{
		return SupplierEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): SupplierEntity
	{
		$supplier = SupplierEntity::query()->findOrFail($id);
		$supplier->update($payload);

		return $supplier->refresh();
	}

	public function delete(int $id): void
	{
		$supplier = SupplierEntity::query()->findOrFail($id);
		$supplier->delete();
	}
}
