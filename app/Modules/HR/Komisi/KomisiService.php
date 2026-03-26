<?php

namespace App\Modules\HR\Komisi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KomisiService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return KomisiEntity::query()
			->with('pegawai:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('periode', 'like', '%' . $search . '%')
						->orWhere('status', 'like', '%' . $search . '%')
						->orWhereHas('pegawai', function ($pegawaiQuery) use ($search) {
							$pegawaiQuery->where('nama', 'like', '%' . $search . '%');
						});
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): KomisiEntity
	{
		return KomisiEntity::query()->create([
			'kode' => $payload['kode'] ?? null,
			'pegawai_id' => $payload['pegawai_id'] ?? null,
			'periode' => $payload['periode'],
			'dasar_perhitungan' => $payload['dasar_perhitungan'] ?? 0,
			'persentase' => $payload['persentase'] ?? 0,
			'nominal' => $payload['nominal'] ?? 0,
			'status' => $payload['status'] ?? 'draft',
			'catatan' => $payload['catatan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);
	}

	public function update(int $id, array $payload): KomisiEntity
	{
		$entity = KomisiEntity::query()->findOrFail($id);

		$entity->update([
			'kode' => $payload['kode'] ?? null,
			'pegawai_id' => $payload['pegawai_id'] ?? null,
			'periode' => $payload['periode'],
			'dasar_perhitungan' => $payload['dasar_perhitungan'] ?? 0,
			'persentase' => $payload['persentase'] ?? 0,
			'nominal' => $payload['nominal'] ?? 0,
			'status' => $payload['status'] ?? 'draft',
			'catatan' => $payload['catatan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);

		return $entity->refresh()->load('pegawai:id,nama');
	}

	public function delete(int $id): void
	{
		$entity = KomisiEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
