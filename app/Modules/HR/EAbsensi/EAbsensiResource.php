<?php

namespace App\Modules\HR\EAbsensi;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EAbsensiResource extends Controller
{
	public function __construct(private readonly EAbsensiService $service)
	{
	}

	public function index(Request $request): Response
	{
		$payload = $this->service->getMobilePayload(
			$request->user(),
			$request->query('calendar_month')
		);

		return Inertia::render('E-Absensi/Index', [
			'mobileData' => EAbsensiCollection::toMobilePayload($payload),
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse
	{
		$mode = (string) $request->input('mode', 'attendance');

		if ($mode === 'profile_update') {
			$payload = $request->validate([
				'name' => ['required', 'string', 'max:150'],
				'email' => ['required', 'email', 'max:120'],
				'nomor_telepon' => ['nullable', 'string', 'max:30'],
				'alamat' => ['nullable', 'string', 'max:1000'],
			]);

			$this->service->updateProfile($request->user(), $payload);

			return redirect()
				->route('hr.e-absensi.index')
				->with('success', 'Profil berhasil diperbarui.');
		}

		if ($mode === 'change_password') {
			$payload = $request->validate([
				'current_password' => ['required', 'string'],
				'new_password' => ['required', 'string', 'min:8', 'confirmed'],
			]);

			$this->service->changePassword($request->user(), $payload);

			return redirect()
				->route('hr.e-absensi.index')
				->with('success', 'Kata sandi berhasil diperbarui.');
		}

		if ($mode === 'request_action') {
			$payload = $request->validate([
				'request_id' => ['required', 'integer', 'exists:absensi_pengajuan,id'],
				'action' => ['required', 'in:accept,reject'],
			]);

			$this->service->respondShiftSwapRequest(
				$request->user(),
				(int) $payload['request_id'],
				(string) $payload['action']
			);

			return redirect()
				->route('hr.e-absensi.index')
				->with('success', 'Permintaan tukar shift berhasil diproses.');
		}

		if ($mode === 'request') {
			$payload = $request->validate([
				'jenis_pengajuan' => ['required', 'in:izin,cuti,tukar_shift'],
				'tanggal_mulai' => ['required', 'date'],
				'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
				'pegawai_tujuan_id' => ['nullable', 'integer', 'required_if:jenis_pengajuan,tukar_shift', 'exists:data_pegawai,id'],
				'jadwal_shift_id' => ['nullable', 'integer', 'exists:jadwal_shift,id'],
				'jadwal_shift_tujuan_id' => ['nullable', 'integer', 'exists:jadwal_shift,id'],
				'alasan' => ['required', 'string', 'max:2000'],
				'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
			]);

			$this->service->submitRequest($request->user(), $payload);

			return redirect()
				->route('hr.e-absensi.index')
				->with('success', 'Pengajuan berhasil dikirim.');
		}

		$payload = $request->validate([
			'jenis_absen' => ['nullable', 'in:masuk,keluar'],
			'status' => ['nullable', 'in:hadir,izin,sakit,alpha,cuti,terlambat'],
			'metode_absen' => ['nullable', 'in:manual,face'],
			'sumber_absen' => ['nullable', 'in:web,web-mobile,flutter'],
			'foto_absen' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
			'watermark_text' => ['nullable', 'string', 'max:255'],
			'latitude' => ['nullable', 'numeric', 'between:-90,90'],
			'longitude' => ['nullable', 'numeric', 'between:-180,180'],
			'lokasi_absen' => ['nullable', 'string', 'max:255'],
			'radius_meter' => ['nullable', 'integer', 'min:1', 'max:10000'],
			'dalam_radius' => ['nullable', 'boolean'],
			'skor_wajah' => ['nullable', 'numeric', 'between:0,100'],
			'status_verifikasi_wajah' => ['nullable', 'in:manual,verified,rejected,pending'],
			'keterangan' => ['nullable', 'string'],
		]);

		$this->service->submitCheckIn($request->user(), $payload);
		$jenisAbsen = (string) ($payload['jenis_absen'] ?? 'masuk');
		$message = $jenisAbsen === 'keluar'
			? 'Absensi pulang berhasil direkam.'
			: 'Absensi masuk berhasil direkam.';

		return redirect()
			->route('hr.e-absensi.index')
			->with('success', $message);
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('hr.e-absensi.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('hr.e-absensi.index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('hr.e-absensi.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('hr.e-absensi.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('hr.e-absensi.index');
	}
}
