<?php

namespace App\Modules\HR\Absensi;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
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
			'tanggal' => ['required', 'date'],
			'jam_masuk' => ['nullable', 'date_format:H:i'],
			'jam_keluar' => ['nullable', 'date_format:H:i'],
			'status' => ['required', 'in:hadir,izin,sakit,alpha,cuti,terlambat'],
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
			'tanggal' => ['required', 'date'],
			'jam_masuk' => ['nullable', 'date_format:H:i'],
			'jam_keluar' => ['nullable', 'date_format:H:i'],
			'status' => ['required', 'in:hadir,izin,sakit,alpha,cuti,terlambat'],
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
