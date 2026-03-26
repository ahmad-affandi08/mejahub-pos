<?php

namespace App\Modules\Inventory\ResepBOM;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ResepBOMService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return ResepBOMEntity::query()
			->with(['menu:id,nama', 'bahanBaku:id,nama,satuan'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhereHas('menu', fn ($menuQuery) => $menuQuery->where('nama', 'like', '%' . $search . '%'))
						->orWhereHas('bahanBaku', fn ($bahanQuery) => $bahanQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->orderByDesc('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): ResepBOMEntity
	{
		if (trim((string) ($payload['kode'] ?? '')) === '') {
			$payload['kode'] = $this->generateCode();
		}

		return ResepBOMEntity::query()->create($payload)->load(['menu:id,nama', 'bahanBaku:id,nama,satuan']);
	}

	public function update(int $id, array $payload): ResepBOMEntity
	{
		$resep = ResepBOMEntity::query()->findOrFail($id);
		$resep->update($payload);

		return $resep->refresh()->load(['menu:id,nama', 'bahanBaku:id,nama,satuan']);
	}

	public function delete(int $id): void
	{
		$resep = ResepBOMEntity::query()->findOrFail($id);
		$resep->delete();
	}

	private function generateCode(): string
	{
		do {
			$code = 'BOM-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (ResepBOMEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
