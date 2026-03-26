<?php

namespace App\Modules\HR\EAbsensi;

use App\Models\User;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\JadwalShift\JadwalShiftEntity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class EAbsensiService
{
	public function getMobilePayload(User $user): array
	{
		$pegawai = $this->resolvePegawai($user);
		$pegawaiId = $pegawai?->id;

		$today = Carbon::now()->toDateString();
		$nowTime = Carbon::now()->format('H:i');

		$todaySchedule = $pegawaiId
			? JadwalShiftEntity::query()
				->with(['shift:id,nama,jam_masuk,jam_keluar,radius_meter,require_face_verification,require_location_validation'])
				->where('pegawai_id', $pegawaiId)
				->whereDate('tanggal', $today)
				->where('is_active', true)
				->first()
			: null;

		$records = $pegawaiId
			? EAbsensiEntity::query()
				->with(['pegawai:id,nama,jabatan,alamat', 'shift:id,nama'])
				->where('pegawai_id', $pegawaiId)
				->latest('tanggal')
				->latest('id')
				->limit(30)
				->get()
			: collect();

		$weeklySummary = $this->buildWeeklySummary($pegawaiId);
		$todayStatus = $this->resolveTodayStatus($records, $today);
		$todayPrimaryAction = $this->resolveTodayPrimaryAction($records, $today);
		$requestHistory = $this->getRequestHistory($pegawaiId);
		$incomingShiftSwapRequests = $this->getIncomingShiftSwapRequests($pegawaiId);
		$coworkers = $this->getCoworkerOptions($pegawaiId);

		return [
			'profile' => [
				'name' => $pegawai?->nama ?: $user->name,
				'email' => $user->email,
				'nomor_telepon' => $pegawai?->nomor_telepon,
				'alamat' => $pegawai?->alamat,
				'role' => $pegawai?->jabatan ?: 'Karyawan',
				'badge' => 'LEAD',
				'shiftLabel' => strtoupper((string) ($todaySchedule?->shift?->nama ?: 'BELUM DIATUR')),
				'avatar' => null,
			],
			'shift_info' => [
				'title' => $todaySchedule?->shift?->nama ?: 'Belum Ada Shift',
				'date' => Carbon::parse($today)->translatedFormat('l, d M Y'),
				'code' => $todaySchedule?->kode ?: 'LOG-' . str_pad((string) ($pegawaiId ?? 0), 3, '0', STR_PAD_LEFT),
				'entry' => $todaySchedule?->shift?->jam_masuk ? substr((string) $todaySchedule->shift->jam_masuk, 0, 5) : '-',
				'exit' => $todaySchedule?->shift?->jam_keluar ? substr((string) $todaySchedule->shift->jam_keluar, 0, 5) : '-',
			],
			'weekly_summary' => $weeklySummary,
			'records' => EAbsensiCollection::formatRecords($records),
			'request_history' => $requestHistory,
			'incoming_shift_swap_requests' => $incomingShiftSwapRequests,
			'coworkers' => $coworkers,
			'today_status' => [
				'current' => $todayStatus,
				'server_time' => $nowTime,
				'primary_action' => $todayPrimaryAction['label'],
				'primary_jenis_absen' => $todayPrimaryAction['jenis_absen'],
			],
			'geo_policy' => [
				'require_location' => (bool) ($todaySchedule?->shift?->require_location_validation ?? true),
				'require_face' => (bool) ($todaySchedule?->shift?->require_face_verification ?? true),
				'radius_meter' => (int) ($todaySchedule?->shift?->radius_meter ?? 10),
				'office_latitude' => $todaySchedule?->shift?->latitude,
				'office_longitude' => $todaySchedule?->shift?->longitude,
			],
		];
	}

	public function submitCheckIn(User $user, array $payload): EAbsensiEntity
	{
		$pegawai = $this->resolvePegawai($user);

		if (!$pegawai) {
			abort(422, 'Data pegawai untuk user ini tidak ditemukan.');
		}

		$today = Carbon::now()->toDateString();
		$nowTime = Carbon::now()->format('H:i:s');

		$todaySchedule = JadwalShiftEntity::query()
			->with(['shift:id,radius_meter'])
			->where('pegawai_id', $pegawai->id)
			->whereDate('tanggal', $today)
			->where('is_active', true)
			->first();

		$jenisAbsen = $payload['jenis_absen'] ?? 'masuk';
		$radiusMeter = (int) ($payload['radius_meter'] ?? ($todaySchedule?->shift?->radius_meter ?? 10));
		$todayRecords = EAbsensiEntity::query()
			->where('pegawai_id', $pegawai->id)
			->whereDate('tanggal', $today)
			->get();

		$hasMasuk = $todayRecords->contains(fn (EAbsensiEntity $record) => $record->jenis_absen === 'masuk');
		$hasKeluar = $todayRecords->contains(fn (EAbsensiEntity $record) => $record->jenis_absen === 'keluar');

		if ($jenisAbsen === 'masuk' && $hasMasuk) {
			throw ValidationException::withMessages([
				'jenis_absen' => 'Anda sudah melakukan absen masuk hari ini.',
			]);
		}

		if ($jenisAbsen === 'keluar' && !$hasMasuk) {
			throw ValidationException::withMessages([
				'jenis_absen' => 'Absen pulang hanya bisa dilakukan setelah absen masuk.',
			]);
		}

		if ($jenisAbsen === 'keluar' && $hasKeluar) {
			throw ValidationException::withMessages([
				'jenis_absen' => 'Anda sudah melakukan absen pulang hari ini.',
			]);
		}

		$requiresLocation = (bool) ($todaySchedule?->shift?->require_location_validation ?? true);
		$requiresFace = (bool) ($todaySchedule?->shift?->require_face_verification ?? true);

		if ($requiresLocation) {
			if (!array_key_exists('latitude', $payload) || !array_key_exists('longitude', $payload)) {
				throw ValidationException::withMessages([
					'latitude' => 'Lokasi wajib diaktifkan untuk absensi.',
				]);
			}

			if (array_key_exists('dalam_radius', $payload) && $payload['dalam_radius'] === false) {
				throw ValidationException::withMessages([
					'dalam_radius' => 'Lokasi Anda berada di luar radius absensi.',
				]);
			}
		}

		if ($requiresFace && (($payload['status_verifikasi_wajah'] ?? null) !== 'verified')) {
			throw ValidationException::withMessages([
				'status_verifikasi_wajah' => 'Verifikasi wajah wajib berhasil sebelum absensi.',
			]);
		}

		return EAbsensiEntity::query()->create([
			'kode' => 'ABS-' . Carbon::now()->format('Ymd-His'),
			'pegawai_id' => $pegawai->id,
			'shift_id' => $todaySchedule?->shift_id,
			'jadwal_shift_id' => $todaySchedule?->id,
			'tanggal' => $today,
			'jenis_absen' => $jenisAbsen,
			'jam_masuk' => $jenisAbsen === 'masuk' ? $nowTime : null,
			'jam_keluar' => $jenisAbsen === 'keluar' ? $nowTime : null,
			'status' => $payload['status'] ?? 'hadir',
			'metode_absen' => $payload['metode_absen'] ?? 'face',
			'sumber_absen' => $payload['sumber_absen'] ?? 'web-mobile',
			'foto_absen' => $payload['foto_absen'] ?? null,
			'watermark_text' => $payload['watermark_text'] ?? null,
			'latitude' => $payload['latitude'] ?? null,
			'longitude' => $payload['longitude'] ?? null,
			'lokasi_absen' => $payload['lokasi_absen'] ?? ($pegawai->alamat ?: null),
			'radius_meter' => $radiusMeter,
			'dalam_radius' => array_key_exists('dalam_radius', $payload) ? (bool) $payload['dalam_radius'] : true,
			'skor_wajah' => $payload['skor_wajah'] ?? 98.5,
			'status_verifikasi_wajah' => $payload['status_verifikasi_wajah'] ?? 'verified',
			'keterangan' => $payload['keterangan'] ?? null,
			'is_active' => true,
		]);
	}

	public function updateProfile(User $user, array $payload): void
	{
		$email = (string) $payload['email'];

		$emailOwner = $email
			? User::query()
				->where('email', $email)
				->where('id', '!=', $user->id)
				->exists()
			: false;

		if ($emailOwner) {
			throw ValidationException::withMessages([
				'email' => 'Email sudah digunakan oleh pengguna lain.',
			]);
		}

		$user->forceFill([
			'name' => (string) $payload['name'],
			'email' => $email,
		])->save();

		$pegawai = DataPegawaiEntity::query()
			->where('user_id', $user->id)
			->where('is_active', true)
			->first();

		if ($pegawai) {
			$pegawai->update([
				'nama' => (string) $payload['name'],
				'nomor_telepon' => $payload['nomor_telepon'] ?? null,
				'alamat' => $payload['alamat'] ?? null,
			]);
		}
	}

	public function changePassword(User $user, array $payload): void
	{
		$currentPassword = (string) ($payload['current_password'] ?? '');
		$newPassword = (string) ($payload['new_password'] ?? '');

		if (!Hash::check($currentPassword, (string) $user->password)) {
			throw ValidationException::withMessages([
				'current_password' => 'Kata sandi saat ini tidak sesuai.',
			]);
		}

		if ($currentPassword === $newPassword) {
			throw ValidationException::withMessages([
				'new_password' => 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
			]);
		}

		$user->forceFill([
			'password' => $newPassword,
		])->save();
	}

	public function submitRequest(User $user, array $payload): EAbsensiPengajuanEntity
	{
		$pegawai = $this->resolvePegawai($user);

		if (!$pegawai) {
			abort(422, 'Data pegawai untuk user ini tidak ditemukan.');
		}

		$jenisPengajuan = (string) ($payload['jenis_pengajuan'] ?? 'izin');
		$status = $jenisPengajuan === 'tukar_shift'
			? 'menunggu_karyawan_tujuan'
			: 'menunggu_atasan';
		$lampiran = isset($payload['lampiran']) ? basename((string) $payload['lampiran']) : null;

		return EAbsensiPengajuanEntity::query()->create([
			'kode' => 'REQ-' . Carbon::now()->format('Ymd-His'),
			'pegawai_id' => $pegawai->id,
			'jenis_pengajuan' => $jenisPengajuan,
			'tanggal_mulai' => $payload['tanggal_mulai'],
			'tanggal_selesai' => $payload['tanggal_selesai'] ?? $payload['tanggal_mulai'],
			'pegawai_tujuan_id' => $jenisPengajuan === 'tukar_shift' ? ($payload['pegawai_tujuan_id'] ?? null) : null,
			'jadwal_shift_id' => $payload['jadwal_shift_id'] ?? null,
			'jadwal_shift_tujuan_id' => $payload['jadwal_shift_tujuan_id'] ?? null,
			'alasan' => $payload['alasan'] ?? null,
			'lampiran' => $lampiran,
			'status' => $status,
			'is_active' => true,
		]);
	}

	public function respondShiftSwapRequest(User $user, int $requestId, string $action): EAbsensiPengajuanEntity
	{
		$pegawai = $this->resolvePegawai($user);

		if (!$pegawai) {
			abort(422, 'Data pegawai untuk user ini tidak ditemukan.');
		}

		$request = EAbsensiPengajuanEntity::query()
			->where('id', $requestId)
			->where('jenis_pengajuan', 'tukar_shift')
			->where('pegawai_tujuan_id', $pegawai->id)
			->firstOrFail();

		if ($request->status !== 'menunggu_karyawan_tujuan') {
			abort(422, 'Pengajuan ini sudah diproses sebelumnya.');
		}

		$request->update([
			'status' => $action === 'accept' ? 'disetujui_karyawan_tujuan' : 'ditolak_karyawan_tujuan',
		]);

		return $request->refresh();
	}

	private function resolvePegawai(User $user): ?DataPegawaiEntity
	{
		$fromUser = DataPegawaiEntity::query()
			->where('user_id', $user->id)
			->where('is_active', true)
			->first();

		if ($fromUser) {
			return $fromUser;
		}

		return DataPegawaiEntity::query()
			->where('is_active', true)
			->orderBy('id')
			->first();
	}

	private function buildWeeklySummary(?int $pegawaiId): array
	{
		$base = collect([
			'hadir' => 0,
			'izin' => 0,
			'sakit' => 0,
			'cuti' => 0,
			'terlambat' => 0,
			'alpha' => 0,
		]);

		if (!$pegawaiId) {
			return $this->mapWeeklySummary($base);
		}

		$rows = EAbsensiEntity::query()
			->selectRaw('status, COUNT(*) as total')
			->where('pegawai_id', $pegawaiId)
			->whereBetween('tanggal', [Carbon::now()->subDays(6)->toDateString(), Carbon::now()->toDateString()])
			->groupBy('status')
			->get();

		foreach ($rows as $row) {
			$key = (string) $row->status;
			if ($base->has($key)) {
				$base->put($key, (int) $row->total);
			}
		}

		return $this->mapWeeklySummary($base);
	}

	private function mapWeeklySummary(Collection $base): array
	{
		return [
			['label' => 'Hadir', 'value' => (int) $base->get('hadir', 0), 'tone' => 'default'],
			['label' => 'Izin', 'value' => (int) $base->get('izin', 0), 'tone' => 'default'],
			['label' => 'Sakit', 'value' => (int) $base->get('sakit', 0), 'tone' => 'warn'],
			['label' => 'Cuti', 'value' => (int) $base->get('cuti', 0), 'tone' => 'default'],
			['label' => 'Terlambat', 'value' => (int) $base->get('terlambat', 0), 'tone' => 'default'],
			['label' => 'Alpha', 'value' => (int) $base->get('alpha', 0), 'tone' => 'default'],
		];
	}

	private function resolveTodayStatus(Collection $records, string $today): string
	{
		$todayRecord = $records->first(function (EAbsensiEntity $record) use ($today) {
			return optional($record->tanggal)->toDateString() === $today;
		});

		if (!$todayRecord) {
			return 'BELUM ABSEN';
		}

		if ($todayRecord->status === 'terlambat') {
			return 'TERLAMBAT';
		}

		if ($todayRecord->status === 'hadir') {
			return 'SUDAH ABSEN';
		}

		return strtoupper((string) $todayRecord->status);
	}

	private function resolveTodayPrimaryAction(Collection $records, string $today): array
	{
		$todayRecords = $records->filter(function (EAbsensiEntity $record) use ($today) {
			return optional($record->tanggal)->toDateString() === $today;
		});

		$hasMasuk = $todayRecords->contains(function (EAbsensiEntity $record) {
			return $record->jenis_absen === 'masuk';
		});

		$hasKeluar = $todayRecords->contains(function (EAbsensiEntity $record) {
			return $record->jenis_absen === 'keluar';
		});

		if (!$hasMasuk) {
			return [
				'label' => 'ABSEN MASUK',
				'jenis_absen' => 'masuk',
			];
		}

		if (!$hasKeluar) {
			return [
				'label' => 'ABSEN PULANG',
				'jenis_absen' => 'keluar',
			];
		}

		return [
			'label' => 'SUDAH ABSEN',
			'jenis_absen' => 'keluar',
		];
	}

	private function getRequestHistory(?int $pegawaiId): array
	{
		if (!$pegawaiId) {
			return [];
		}

		$items = EAbsensiPengajuanEntity::query()
			->with(['pegawaiTujuan:id,nama'])
			->where('pegawai_id', $pegawaiId)
			->latest('id')
			->limit(10)
			->get();

		return $items->map(function (EAbsensiPengajuanEntity $item) {
			return [
				'id' => $item->id,
				'kode' => $item->kode,
				'jenis_pengajuan' => $item->jenis_pengajuan,
				'tanggal_mulai' => optional($item->tanggal_mulai)->toDateString(),
				'tanggal_selesai' => optional($item->tanggal_selesai)->toDateString(),
				'pegawai_tujuan_nama' => $item->pegawaiTujuan?->nama,
				'status' => $item->status,
			];
		})->values()->all();
	}

	private function getCoworkerOptions(?int $pegawaiId): array
	{
		return DataPegawaiEntity::query()
			->select(['id', 'nama', 'jabatan'])
			->where('is_active', true)
			->when($pegawaiId, fn ($query) => $query->where('id', '!=', $pegawaiId))
			->orderBy('nama')
			->limit(300)
			->get()
			->map(fn (DataPegawaiEntity $item) => [
				'id' => $item->id,
				'nama' => $item->nama,
				'jabatan' => $item->jabatan,
			])
			->values()
			->all();
	}

	private function getIncomingShiftSwapRequests(?int $pegawaiId): array
	{
		if (!$pegawaiId) {
			return [];
		}

		$items = EAbsensiPengajuanEntity::query()
			->with(['pegawai:id,nama,jabatan'])
			->where('jenis_pengajuan', 'tukar_shift')
			->where('pegawai_tujuan_id', $pegawaiId)
			->where('status', 'menunggu_karyawan_tujuan')
			->latest('id')
			->limit(10)
			->get();

		return $items->map(function (EAbsensiPengajuanEntity $item) {
			return [
				'id' => $item->id,
				'kode' => $item->kode,
				'pengaju_nama' => $item->pegawai?->nama,
				'pengaju_jabatan' => $item->pegawai?->jabatan,
				'tanggal_mulai' => optional($item->tanggal_mulai)->toDateString(),
				'tanggal_selesai' => optional($item->tanggal_selesai)->toDateString(),
				'alasan' => $item->alasan,
			];
		})->values()->all();
	}
}
