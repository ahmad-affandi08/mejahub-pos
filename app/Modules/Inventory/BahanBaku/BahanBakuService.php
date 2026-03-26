<?php

namespace App\Modules\Inventory\BahanBaku;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BahanBakuService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return BahanBakuEntity::query()
			->with('supplier:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('satuan', 'like', '%' . $search . '%')
						->orWhereHas('supplier', function ($supplierQuery) use ($search) {
							$supplierQuery->where('nama', 'like', '%' . $search . '%');
						});
				});
			})
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): BahanBakuEntity
	{
		return BahanBakuEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): BahanBakuEntity
	{
		$bahanBaku = BahanBakuEntity::query()->findOrFail($id);
		$bahanBaku->update($payload);

		return $bahanBaku->refresh();
	}

	public function delete(int $id): void
	{
		$bahanBaku = BahanBakuEntity::query()->findOrFail($id);
		$bahanBaku->delete();
	}
}
