<?php

namespace App\Modules\Meja\DataMeja;

use App\Http\Controllers\Controller;
use App\Modules\Meja\AreaMeja\AreaMejaEntity;
use App\Modules\Meja\DataMeja\DataMejaCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataMejaResource extends Controller
{
	public function __construct(private readonly DataMejaService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Meja/DataMeja/Index', [
			'dataMeja' => DataMejaCollection::toIndex($paginator),
			'areaOptions' => AreaMejaEntity::query()
				->select(['id', 'nama'])
				->orderBy('nama')
				->get(),
			'statusOptions' => [
				['value' => 'tersedia', 'label' => 'Tersedia'],
				['value' => 'terisi', 'label' => 'Terisi'],
				['value' => 'reservasi', 'label' => 'Reservasi'],
				['value' => 'perawatan', 'label' => 'Perawatan'],
			],
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
			'area_meja_id' => ['required', 'integer', 'exists:area_meja,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:data_meja,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'nomor_meja' => ['nullable', 'string', 'max:30'],
			'kapasitas' => ['required', 'integer', 'min:1'],
			'status' => ['required', 'string', 'in:tersedia,terisi,reservasi,perawatan'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('meja.data-meja.index')
			->with('success', 'Data meja berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'area_meja_id' => ['required', 'integer', 'exists:area_meja,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:data_meja,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'nomor_meja' => ['nullable', 'string', 'max:30'],
			'kapasitas' => ['required', 'integer', 'min:1'],
			'status' => ['required', 'string', 'in:tersedia,terisi,reservasi,perawatan'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('meja.data-meja.index')
			->with('success', 'Data meja berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('meja.data-meja.index')
			->with('success', 'Data meja berhasil dihapus.');
	}
}
