<?php

namespace App\Modules\HR\Absensi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AbsensiService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return AbsensiEntity::query()
			->with('pegawai:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('status', 'like', '%' . $search . '%')
						->orWhere('tanggal', 'like', '%' . $search . '%')
						->orWhereHas('pegawai', function ($pegawaiQuery) use ($search) {
							$pegawaiQuery->where('nama', 'like', '%' . $search . '%');
						});
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload): AbsensiEntity
	{
		return AbsensiEntity::query()->create([
			'kode' => $payload['kode'] ?? null,
			'pegawai_id' => $payload['pegawai_id'] ?? null,
			'tanggal' => $payload['tanggal'],
			'jam_masuk' => $payload['jam_masuk'] ?? null,
			'jam_keluar' => $payload['jam_keluar'] ?? null,
			'status' => $payload['status'] ?? 'hadir',
			'keterangan' => $payload['keterangan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);
	}

	public function update(int $id, array $payload): AbsensiEntity
	{
		$entity = AbsensiEntity::query()->findOrFail($id);

		$entity->update([
			'kode' => $payload['kode'] ?? null,
			'pegawai_id' => $payload['pegawai_id'] ?? null,
			'tanggal' => $payload['tanggal'],
			'jam_masuk' => $payload['jam_masuk'] ?? null,
			'jam_keluar' => $payload['jam_keluar'] ?? null,
			'status' => $payload['status'] ?? 'hadir',
			'keterangan' => $payload['keterangan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);

		return $entity->refresh()->load('pegawai:id,nama');
	}

	public function delete(int $id): void
	{
		$entity = AbsensiEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
