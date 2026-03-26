<?php

namespace App\Modules\Settings\ProfilToko;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
				'error' => $request->session()->get('error'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse
	{
		if (ProfilTokoEntity::query()->count() > 0) {
			return redirect()
				->route('settings.profil-toko.index')
				->with('error', 'Profil toko hanya boleh 1 data. Silakan edit profil yang sudah ada.');
		}

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
			'logo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
			'timezone' => ['nullable', 'string', 'max:80'],
			'mata_uang' => ['nullable', 'string', 'max:10'],
			'bahasa' => ['nullable', 'string', 'max:10'],
			'is_default' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
		], [
			'logo_file.image' => 'Upload gagal: file logo harus berupa gambar.',
			'logo_file.mimes' => 'Upload gagal: format logo hanya boleh JPG, JPEG, PNG, atau WEBP.',
			'logo_file.max' => 'Upload gagal: ukuran gambar maksimal 2MB.',
		]);

		$payload['timezone'] = $payload['timezone'] ?? 'Asia/Jakarta';
		$payload['mata_uang'] = $payload['mata_uang'] ?? 'IDR';
		$payload['bahasa'] = $payload['bahasa'] ?? 'id';
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		if ($request->hasFile('logo_file')) {
			$payload['logo_path'] = $this->storeLogo($request->file('logo_file'));
		}

		unset($payload['logo_file']);

		$this->service->create($payload);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$current = ProfilTokoEntity::query()->findOrFail($id);

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
			'logo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
			'timezone' => ['nullable', 'string', 'max:80'],
			'mata_uang' => ['nullable', 'string', 'max:10'],
			'bahasa' => ['nullable', 'string', 'max:10'],
			'is_default' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
		], [
			'logo_file.image' => 'Upload gagal: file logo harus berupa gambar.',
			'logo_file.mimes' => 'Upload gagal: format logo hanya boleh JPG, JPEG, PNG, atau WEBP.',
			'logo_file.max' => 'Upload gagal: ukuran gambar maksimal 2MB.',
		]);

		$payload['timezone'] = $payload['timezone'] ?? 'Asia/Jakarta';
		$payload['mata_uang'] = $payload['mata_uang'] ?? 'IDR';
		$payload['bahasa'] = $payload['bahasa'] ?? 'id';
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		if ($request->hasFile('logo_file')) {
			$payload['logo_path'] = $this->storeLogo($request->file('logo_file'));
			$this->deleteLogo($current->logo_path);
		}

		unset($payload['logo_file']);

		$this->service->update($id, $payload);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$current = ProfilTokoEntity::query()->findOrFail($id);
		$this->service->delete($id);
		$this->deleteLogo($current->logo_path);

		return redirect()
			->route('settings.profil-toko.index')
			->with('success', 'Profil toko berhasil dihapus.');
	}

	private function storeLogo(UploadedFile $file): string
	{
		$filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
		Storage::disk('public')->putFileAs('profil-toko', $file, $filename);

		return $filename;
	}

	private function deleteLogo(?string $logoPath): void
	{
		if (empty($logoPath)) {
			return;
		}

		$storedPath = Str::contains($logoPath, '/') ? $logoPath : 'profil-toko/' . $logoPath;
		Storage::disk('public')->delete($storedPath);
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
