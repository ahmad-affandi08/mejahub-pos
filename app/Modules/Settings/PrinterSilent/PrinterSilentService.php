<?php

namespace App\Modules\Settings\PrinterSilent;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PrinterSilentService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return PrinterSilentEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('tipe_printer', 'like', '%' . $search . '%')
						->orWhere('connection_type', 'like', '%' . $search . '%')
						->orWhere('ip_address', 'like', '%' . $search . '%')
						->orWhere('device_name', 'like', '%' . $search . '%');
				});
			})
			->orderByDesc('is_default')
			->orderBy('nama')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): PrinterSilentEntity
	{
		if (($payload['is_default'] ?? false) === true) {
			PrinterSilentEntity::query()->update(['is_default' => false]);
		}

		return PrinterSilentEntity::query()->create($payload);
	}

	public function update(int $id, array $payload): PrinterSilentEntity
	{
		$entity = PrinterSilentEntity::query()->findOrFail($id);

		if (($payload['is_default'] ?? false) === true) {
			PrinterSilentEntity::query()
				->where('id', '!=', $entity->id)
				->update(['is_default' => false]);
		}

		$entity->update($payload);

		return $entity->refresh();
	}

	public function delete(int $id): void
	{
		$entity = PrinterSilentEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
