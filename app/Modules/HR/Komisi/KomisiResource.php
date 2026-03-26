<?php

namespace App\Modules\HR\Komisi;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KomisiResource extends Controller
{
	public function __construct(private readonly KomisiService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('HR/Komisi/Index', [
			'komisi' => KomisiCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:komisi,kode'],
			'pegawai_id' => ['nullable', 'integer', 'exists:data_pegawai,id'],
			'periode' => ['required', 'regex:/^\\d{4}-\\d{2}$/'],
			'dasar_perhitungan' => ['nullable', 'numeric', 'min:0'],
			'persentase' => ['nullable', 'numeric', 'min:0'],
			'nominal' => ['nullable', 'numeric', 'min:0'],
			'status' => ['required', 'in:draft,proses,dibayar,dibatalkan'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('hr.komisi.index')
			->with('success', 'Data komisi berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:40', 'unique:komisi,kode,' . $id],
			'pegawai_id' => ['nullable', 'integer', 'exists:data_pegawai,id'],
			'periode' => ['required', 'regex:/^\\d{4}-\\d{2}$/'],
			'dasar_perhitungan' => ['nullable', 'numeric', 'min:0'],
			'persentase' => ['nullable', 'numeric', 'min:0'],
			'nominal' => ['nullable', 'numeric', 'min:0'],
			'status' => ['required', 'in:draft,proses,dibayar,dibatalkan'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('hr.komisi.index')
			->with('success', 'Data komisi berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('hr.komisi.index')
			->with('success', 'Data komisi berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('hr.komisi.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('hr.komisi.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('hr.komisi.index');
	}
}
