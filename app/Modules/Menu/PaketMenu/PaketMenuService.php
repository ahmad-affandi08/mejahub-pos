<?php

namespace App\Modules\Menu\PaketMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PaketMenuService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return PaketMenuEntity::query()
			->with([
				'kategori:id,nama',
				'items:id,paket_menu_id,data_menu_id,qty,urutan',
				'items.dataMenu:id,nama',
			])
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('nama', 'like', '%' . $search . '%')
					->orWhere('kode', 'like', '%' . $search . '%');
			})
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): PaketMenuEntity
	{
		return DB::transaction(function () use ($payload) {
			$itemRows = $payload['item_rows'] ?? [];
			unset($payload['item_rows']);

			$paket = PaketMenuEntity::query()->create($payload);
			$this->syncItems($paket, $itemRows);

			return $paket->refresh();
		});
	}

	public function update(int $id, array $payload): PaketMenuEntity
	{
		return DB::transaction(function () use ($id, $payload) {
			$itemRows = $payload['item_rows'] ?? [];
			unset($payload['item_rows']);

			$paket = PaketMenuEntity::query()->findOrFail($id);
			$paket->update($payload);
			$this->syncItems($paket, $itemRows);

			return $paket->refresh();
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$paket = PaketMenuEntity::query()->findOrFail($id);
			$paket->items()->delete();
			$paket->delete();
		});
	}

	private function syncItems(PaketMenuEntity $paket, array $itemRows): void
	{
		$paket->items()->delete();

		foreach ($itemRows as $index => $row) {
			if (empty($row['data_menu_id'])) {
				continue;
			}

			$paket->items()->create([
				'data_menu_id' => (int) $row['data_menu_id'],
				'qty' => (float) ($row['qty'] ?? 1),
				'urutan' => $index,
			]);
		}
	}
}
