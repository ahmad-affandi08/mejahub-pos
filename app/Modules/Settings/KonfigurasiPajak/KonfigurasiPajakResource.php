<?php

namespace App\Modules\Settings\KonfigurasiPajak;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KonfigurasiPajakResource extends Controller
{
	public function __construct(private readonly KonfigurasiPajakService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Settings/KonfigurasiPajak/Index', [
			'konfigurasiPajak' => KonfigurasiPajakCollection::toIndex($paginator),
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
			'kode' => ['required', 'string', 'max:30', 'unique:settings_konfigurasi_pajak,kode'],
			'nama' => ['required', 'string', 'max:100'],
			'jenis' => ['required', 'string', 'in:percentage,fixed'],
			'nilai' => ['required', 'numeric', 'min:0'],
			'applies_to' => ['required', 'string', 'in:subtotal,service_charge,all'],
			'is_inclusive' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'keterangan' => ['nullable', 'string'],
		]);

		$payload['nilai'] = (float) $payload['nilai'];
		$payload['is_inclusive'] = (bool) ($payload['is_inclusive'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->create($payload);

		return redirect()
			->route('settings.konfigurasi-pajak.index')
			->with('success', 'Konfigurasi pajak berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['required', 'string', 'max:30', 'unique:settings_konfigurasi_pajak,kode,' . $id],
			'nama' => ['required', 'string', 'max:100'],
			'jenis' => ['required', 'string', 'in:percentage,fixed'],
			'nilai' => ['required', 'numeric', 'min:0'],
			'applies_to' => ['required', 'string', 'in:subtotal,service_charge,all'],
			'is_inclusive' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'keterangan' => ['nullable', 'string'],
		]);

		$payload['nilai'] = (float) $payload['nilai'];
		$payload['is_inclusive'] = (bool) ($payload['is_inclusive'] ?? false);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->update($id, $payload);

		return redirect()
			->route('settings.konfigurasi-pajak.index')
			->with('success', 'Konfigurasi pajak berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('settings.konfigurasi-pajak.index')
			->with('success', 'Konfigurasi pajak berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('settings.konfigurasi-pajak.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('settings.konfigurasi-pajak.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('settings.konfigurasi-pajak.index');
	}
}
