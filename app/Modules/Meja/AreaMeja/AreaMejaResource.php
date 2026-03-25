<?php

namespace App\Modules\Meja\AreaMeja;

use App\Http\Controllers\Controller;
use App\Modules\Meja\AreaMeja\AreaMejaCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AreaMejaResource extends Controller
{
	public function __construct(private readonly AreaMejaService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Meja/AreaMeja/Index', [
			'areaMeja' => AreaMejaCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:30', 'unique:area_meja,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('meja.area-meja.index')
			->with('success', 'Area meja berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:30', 'unique:area_meja,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('meja.area-meja.index')
			->with('success', 'Area meja berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('meja.area-meja.index')
			->with('success', 'Area meja berhasil dihapus.');
	}
}
