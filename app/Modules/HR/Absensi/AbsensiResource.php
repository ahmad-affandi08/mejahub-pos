<?php

namespace App\Modules\HR\Absensi;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\JadwalShift\JadwalShiftEntity;
use App\Modules\HR\PengaturanShift\PengaturanShiftEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AbsensiResource extends Controller
{
	public function __construct(private readonly AbsensiService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('HR/Absensi/Index', [
			'absensi' => AbsensiCollection::toIndex($paginator),
			'pegawaiOptions' => DataPegawaiEntity::query()
				->select(['id', 'nama'])
				->orderBy('nama')
				->get(),
			'shiftOptions' => PengaturanShiftEntity::query()
				->select(['id', 'nama', 'jam_masuk', 'jam_keluar'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'jadwalOptions' => JadwalShiftEntity::query()
				->select(['id', 'kode', 'pegawai_id', 'shift_id', 'tanggal'])
				->where('is_active', true)
				->orderByDesc('tanggal')
				->limit(500)
				->get(),
			'filters' => [
				'search' => $search,
				'per_page' => $perPage,
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:40', 'unique:absensi,kode'],
			'pegawai_id' => ['nullable', 'integer', 'exists:data_pegawai,id'],
			'shift_id' => ['nullable', 'integer', 'exists:pengaturan_shift,id'],
			'jadwal_shift_id' => ['nullable', 'integer', 'exists:jadwal_shift,id'],
			'tanggal' => ['required', 'date'],
			'jenis_absen' => ['required', 'in:masuk,keluar'],
			'jam_masuk' => ['nullable', 'date_format:H:i'],
			'jam_keluar' => ['nullable', 'date_format:H:i'],
			'status' => ['required', 'in:hadir,izin,sakit,alpha,cuti,terlambat'],
			'metode_absen' => ['required', 'in:manual,face'],
			'sumber_absen' => ['required', 'in:web,web-mobile,flutter'],
			'foto_absen' => ['nullable', 'string', 'max:255'],
			'watermark_text' => ['nullable', 'string', 'max:255'],
			'latitude' => ['nullable', 'numeric', 'between:-90,90'],
			'longitude' => ['nullable', 'numeric', 'between:-180,180'],
			'lokasi_absen' => ['nullable', 'string', 'max:255'],
			'radius_meter' => ['nullable', 'integer', 'min:1', 'max:10000'],
			'dalam_radius' => ['nullable', 'boolean'],
			'skor_wajah' => ['nullable', 'numeric', 'between:0,100'],
			'status_verifikasi_wajah' => ['nullable', 'in:manual,verified,rejected,pending'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('hr.absensi.index')
			->with('success', 'Data absensi berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:40', 'unique:absensi,kode,' . $id],
			'pegawai_id' => ['nullable', 'integer', 'exists:data_pegawai,id'],
			'shift_id' => ['nullable', 'integer', 'exists:pengaturan_shift,id'],
			'jadwal_shift_id' => ['nullable', 'integer', 'exists:jadwal_shift,id'],
			'tanggal' => ['required', 'date'],
			'jenis_absen' => ['required', 'in:masuk,keluar'],
			'jam_masuk' => ['nullable', 'date_format:H:i'],
			'jam_keluar' => ['nullable', 'date_format:H:i'],
			'status' => ['required', 'in:hadir,izin,sakit,alpha,cuti,terlambat'],
			'metode_absen' => ['required', 'in:manual,face'],
			'sumber_absen' => ['required', 'in:web,web-mobile,flutter'],
			'foto_absen' => ['nullable', 'string', 'max:255'],
			'watermark_text' => ['nullable', 'string', 'max:255'],
			'latitude' => ['nullable', 'numeric', 'between:-90,90'],
			'longitude' => ['nullable', 'numeric', 'between:-180,180'],
			'lokasi_absen' => ['nullable', 'string', 'max:255'],
			'radius_meter' => ['nullable', 'integer', 'min:1', 'max:10000'],
			'dalam_radius' => ['nullable', 'boolean'],
			'skor_wajah' => ['nullable', 'numeric', 'between:0,100'],
			'status_verifikasi_wajah' => ['nullable', 'in:manual,verified,rejected,pending'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('hr.absensi.index')
			->with('success', 'Data absensi berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('hr.absensi.index')
			->with('success', 'Data absensi berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('hr.absensi.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('hr.absensi.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('hr.absensi.index');
	}
}
