<?php

namespace App\Modules\Inventory\ResepBOM;

use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResepBOMService
{
	public function paginateMenuCards(string $search = '', ?int $kategoriMenuId = null, int $perPage = 12): LengthAwarePaginator
	{
		return ResepBOMEntity::query()
			->join('data_menu as dm', 'dm.id', '=', 'inventory_resep_bom.data_menu_id')
			->leftJoin('kategori_menu as km', 'km.id', '=', 'dm.kategori_menu_id')
			->leftJoin('inventory_bahan_baku as bb', 'bb.id', '=', 'inventory_resep_bom.bahan_baku_id')
			->whereNull('inventory_resep_bom.deleted_at')
			->whereNull('dm.deleted_at')
			->when($kategoriMenuId, fn ($query) => $query->where('dm.kategori_menu_id', $kategoriMenuId))
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('dm.nama', 'like', '%' . $search . '%')
						->orWhere('dm.kode', 'like', '%' . $search . '%')
						->orWhere('bb.nama', 'like', '%' . $search . '%');
				});
			})
			->selectRaw('dm.id as data_menu_id, dm.nama as menu_nama, dm.kategori_menu_id as menu_kategori_id, COALESCE(km.nama, "Tanpa kategori") as menu_kategori_nama, COUNT(inventory_resep_bom.id) as total_bahan')
			->groupBy('dm.id', 'dm.nama', 'dm.kategori_menu_id', 'km.nama')
			->orderBy('dm.nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function paginate(string $search = '', ?int $kategoriMenuId = null, int $perPage = 10): LengthAwarePaginator
	{
		return ResepBOMEntity::query()
			->with(['menu:id,nama,kategori_menu_id', 'menu.kategori:id,nama', 'bahanBaku:id,nama,satuan'])
			->when($kategoriMenuId, function ($query) use ($kategoriMenuId) {
				$query->whereHas('menu', fn ($menuQuery) => $menuQuery->where('kategori_menu_id', $kategoriMenuId));
			})
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

	public function menuDetail(int $menuId): ?array
	{
		$menu = DataMenuEntity::query()
			->with('kategori:id,nama')
			->find($menuId);

		if (!$menu) {
			return null;
		}

		$items = ResepBOMEntity::query()
			->with('bahanBaku:id,nama,satuan')
			->where('data_menu_id', $menuId)
			->orderBy('id')
			->get();

		return [
			'menu' => [
				'id' => (int) $menu->id,
				'nama' => (string) $menu->nama,
				'kategori_nama' => (string) ($menu->kategori?->nama ?? 'Tanpa kategori'),
			],
			'items' => $items,
		];
	}

	public function create(array $payload): ResepBOMEntity
	{
		if (trim((string) ($payload['kode'] ?? '')) === '') {
			$payload['kode'] = $this->generateCode();
		}

		return ResepBOMEntity::query()->create($payload)->load(['menu:id,nama,kategori_menu_id', 'menu.kategori:id,nama', 'bahanBaku:id,nama,satuan']);
	}

	public function createMany(array $items): void
	{
		DB::transaction(function () use ($items) {
			foreach ($items as $payload) {
				$this->create($payload);
			}
		});
	}

	public function update(int $id, array $payload): ResepBOMEntity
	{
		$resep = ResepBOMEntity::query()->findOrFail($id);
		$resep->update($payload);

		return $resep->refresh()->load(['menu:id,nama,kategori_menu_id', 'menu.kategori:id,nama', 'bahanBaku:id,nama,satuan']);
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
