<?php

namespace App\Modules\Menu\KategoriMenu;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Modules\Menu\KategoriMenu\KategoriMenuCollection;
use App\Modules\Menu\KategoriMenu\KategoriMenuService;

class KategoriMenuResource extends Controller
{
	public function __construct(private readonly KategoriMenuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Menu/KategoriMenu/Index', [
			'kategoriMenu' => KategoriMenuCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:30', 'unique:kategori_menu,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->create($payload);

		return redirect()
			->route('menu.kategori-menu.index')
			->with('success', 'Kategori menu berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:30', 'unique:kategori_menu,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
			'urutan' => ['nullable', 'integer', 'min:0'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);

		$this->service->update($id, $payload);

		return redirect()
			->route('menu.kategori-menu.index')
			->with('success', 'Kategori menu berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('menu.kategori-menu.index')
			->with('success', 'Kategori menu berhasil dihapus.');
	}
}
