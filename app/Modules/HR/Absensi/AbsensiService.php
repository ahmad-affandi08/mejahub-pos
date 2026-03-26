<?php

namespace App\Modules\HR\Absensi;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AbsensiService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return AbsensiEntity::query()
			->with([
				'pegawai:id,nama',
				'shift:id,nama',
				'jadwalShift:id,kode,tanggal',
			])
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
			'shift_id' => $payload['shift_id'] ?? null,
			'jadwal_shift_id' => $payload['jadwal_shift_id'] ?? null,
			'tanggal' => $payload['tanggal'],
			'jenis_absen' => $payload['jenis_absen'] ?? 'masuk',
			'jam_masuk' => $payload['jam_masuk'] ?? null,
			'jam_keluar' => $payload['jam_keluar'] ?? null,
			'status' => $payload['status'] ?? 'hadir',
			'metode_absen' => $payload['metode_absen'] ?? 'manual',
			'sumber_absen' => $payload['sumber_absen'] ?? 'web',
			'foto_absen' => $payload['foto_absen'] ?? null,
			'watermark_text' => $payload['watermark_text'] ?? null,
			'latitude' => $payload['latitude'] ?? null,
			'longitude' => $payload['longitude'] ?? null,
			'lokasi_absen' => $payload['lokasi_absen'] ?? null,
			'radius_meter' => $payload['radius_meter'] ?? null,
			'dalam_radius' => array_key_exists('dalam_radius', $payload)
				? (bool) $payload['dalam_radius']
				: null,
			'skor_wajah' => $payload['skor_wajah'] ?? null,
			'status_verifikasi_wajah' => $payload['status_verifikasi_wajah'] ?? 'manual',
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
			'shift_id' => $payload['shift_id'] ?? null,
			'jadwal_shift_id' => $payload['jadwal_shift_id'] ?? null,
			'tanggal' => $payload['tanggal'],
			'jenis_absen' => $payload['jenis_absen'] ?? 'masuk',
			'jam_masuk' => $payload['jam_masuk'] ?? null,
			'jam_keluar' => $payload['jam_keluar'] ?? null,
			'status' => $payload['status'] ?? 'hadir',
			'metode_absen' => $payload['metode_absen'] ?? 'manual',
			'sumber_absen' => $payload['sumber_absen'] ?? 'web',
			'foto_absen' => $payload['foto_absen'] ?? null,
			'watermark_text' => $payload['watermark_text'] ?? null,
			'latitude' => $payload['latitude'] ?? null,
			'longitude' => $payload['longitude'] ?? null,
			'lokasi_absen' => $payload['lokasi_absen'] ?? null,
			'radius_meter' => $payload['radius_meter'] ?? null,
			'dalam_radius' => array_key_exists('dalam_radius', $payload)
				? (bool) $payload['dalam_radius']
				: null,
			'skor_wajah' => $payload['skor_wajah'] ?? null,
			'status_verifikasi_wajah' => $payload['status_verifikasi_wajah'] ?? 'manual',
			'keterangan' => $payload['keterangan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);

		return $entity->refresh()->load([
			'pegawai:id,nama',
			'shift:id,nama',
			'jadwalShift:id,kode,tanggal',
		]);
	}

	public function delete(int $id): void
	{
		$entity = AbsensiEntity::query()->findOrFail($id);
		$entity->delete();
	}
}
