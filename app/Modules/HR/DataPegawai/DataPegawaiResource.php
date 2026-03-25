<?php

namespace App\Modules\HR\DataPegawai;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataPegawaiResource extends Controller
{
	public function __construct(private readonly DataPegawaiService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('HR/DataPegawai/Index', [
			'pegawai' => DataPegawaiCollection::toIndex($paginator),
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
			'no_identitas' => ['nullable', 'string', 'max:50', 'unique:data_pegawai,no_identitas'],
			'nama' => ['required', 'string', 'max:150'],
			'jabatan' => ['nullable', 'string', 'max:100'],
			'nomor_telepon' => ['nullable', 'string', 'max:30'],
			'alamat' => ['nullable', 'string'],
			'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
			'password' => ['nullable', 'required_with:email', 'string', 'min:8'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('hr.data-pegawai.index')
			->with('success', 'Data pegawai berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$pegawai = DataPegawaiEntity::query()->with('user')->findOrFail($id);
		$userId = $pegawai->user_id;

		$payload = $request->validate([
			'no_identitas' => ['nullable', 'string', 'max:50', 'unique:data_pegawai,no_identitas,' . $id],
			'nama' => ['required', 'string', 'max:150'],
			'jabatan' => ['nullable', 'string', 'max:100'],
			'nomor_telepon' => ['nullable', 'string', 'max:30'],
			'alamat' => ['nullable', 'string'],
			'email' => ['nullable', 'email', 'max:255', 'unique:users,email,' . $userId],
			'password' => ['nullable', 'string', 'min:8'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('hr.data-pegawai.index')
			->with('success', 'Data pegawai berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('hr.data-pegawai.index')
			->with('success', 'Data pegawai berhasil dihapus.');
	}
}
