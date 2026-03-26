<?php

namespace App\Modules\Settings\MetodePembayaran;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MetodePembayaranResource extends Controller
{
	public function __construct(private readonly MetodePembayaranService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Settings/MetodePembayaran/Index', [
			'metodePembayaran' => MetodePembayaranCollection::toIndex($paginator),
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
			'kode' => ['required', 'string', 'max:30', 'unique:settings_metode_pembayaran,kode'],
			'nama' => ['required', 'string', 'max:100'],
			'tipe' => ['required', 'string', 'in:cash,digital,card,transfer,ewallet,other'],
			'provider' => ['nullable', 'string', 'max:100'],
			'nomor_rekening' => ['nullable', 'string', 'max:80'],
			'atas_nama' => ['nullable', 'string', 'max:100'],
			'biaya_persen' => ['nullable', 'numeric', 'min:0'],
			'biaya_flat' => ['nullable', 'numeric', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'requires_reference' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
		]);

		$payload['biaya_persen'] = (float) ($payload['biaya_persen'] ?? 0);
		$payload['biaya_flat'] = (float) ($payload['biaya_flat'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['requires_reference'] = (bool) ($payload['requires_reference'] ?? false);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->create($payload);

		return redirect()
			->route('settings.metode-pembayaran.index')
			->with('success', 'Metode pembayaran berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['required', 'string', 'max:30', 'unique:settings_metode_pembayaran,kode,' . $id],
			'nama' => ['required', 'string', 'max:100'],
			'tipe' => ['required', 'string', 'in:cash,digital,card,transfer,ewallet,other'],
			'provider' => ['nullable', 'string', 'max:100'],
			'nomor_rekening' => ['nullable', 'string', 'max:80'],
			'atas_nama' => ['nullable', 'string', 'max:100'],
			'biaya_persen' => ['nullable', 'numeric', 'min:0'],
			'biaya_flat' => ['nullable', 'numeric', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'requires_reference' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
		]);

		$payload['biaya_persen'] = (float) ($payload['biaya_persen'] ?? 0);
		$payload['biaya_flat'] = (float) ($payload['biaya_flat'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['requires_reference'] = (bool) ($payload['requires_reference'] ?? false);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->update($id, $payload);

		return redirect()
			->route('settings.metode-pembayaran.index')
			->with('success', 'Metode pembayaran berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('settings.metode-pembayaran.index')
			->with('success', 'Metode pembayaran berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('settings.metode-pembayaran.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('settings.metode-pembayaran.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('settings.metode-pembayaran.index');
	}
}
