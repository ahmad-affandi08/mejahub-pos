<?php

namespace App\Modules\Settings\ProfilToko;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfilTokoResource extends Controller
{
	public function __construct(private readonly ProfilTokoService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Settings/ProfilToko/Index', [
			'profilToko' => ProfilTokoCollection::toIndex($paginator),
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
			'kode_toko' => ['nullable', 'string', 'max:40', 'unique:settings_profil_toko,kode_toko'],
			'nama_toko' => ['required', 'string', 'max:150'],
			'nama_brand' => ['nullable', 'string', 'max:150'],
			'email' => ['nullable', 'email', 'max:120'],
			'telepon' => ['nullable', 'string', 'max:30'],
			'alamat' => ['nullable', 'string'],
			'kota' => ['nullable', 'string', 'max:100'],
			'provinsi' => ['nullable', 'string', 'max:100'],
			'kode_pos' => ['nullable', 'string', 'max:10'],
			'npwp' => ['nullable', 'string', 'max:40'],
			'logo_path' => ['nullable', 'string', 'max:255'],
			'timezone' => ['nullable', 'string', 'max:80'],
			'mata_uang' => ['nullable', 'string', 'max:10'],
			'bahasa' => ['nullable', 'string', 'max:10'],
			'is_default' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['timezone'] = $payload['timezone'] ?? 'Asia/Jakarta';
		$payload['mata_uang'] = $payload['mata_uang'] ?? 'IDR';
		$payload['bahasa'] = $payload['bahasa'] ?? 'id';
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode_toko' => ['nullable', 'string', 'max:40', 'unique:settings_profil_toko,kode_toko,' . $id],
			'nama_toko' => ['required', 'string', 'max:150'],
			'nama_brand' => ['nullable', 'string', 'max:150'],
			'email' => ['nullable', 'email', 'max:120'],
			'telepon' => ['nullable', 'string', 'max:30'],
			'alamat' => ['nullable', 'string'],
			'kota' => ['nullable', 'string', 'max:100'],
			'provinsi' => ['nullable', 'string', 'max:100'],
			'kode_pos' => ['nullable', 'string', 'max:10'],
			'npwp' => ['nullable', 'string', 'max:40'],
			'logo_path' => ['nullable', 'string', 'max:255'],
			'timezone' => ['nullable', 'string', 'max:80'],
			'mata_uang' => ['nullable', 'string', 'max:10'],
			'bahasa' => ['nullable', 'string', 'max:10'],
			'is_default' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['timezone'] = $payload['timezone'] ?? 'Asia/Jakarta';
		$payload['mata_uang'] = $payload['mata_uang'] ?? 'IDR';
		$payload['bahasa'] = $payload['bahasa'] ?? 'id';
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('settings.profil-toko.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('settings.profil-toko.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('settings.profil-toko.index');
	}
}
