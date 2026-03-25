<?php

namespace App\Modules\Menu\VarianMenu;

use App\Http\Controllers\Controller;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\Menu\VarianMenu\VarianMenuCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VarianMenuResource extends Controller
{
	public function __construct(private readonly VarianMenuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Menu/VarianMenu/Index', [
			'varianMenu' => VarianMenuCollection::toIndex($paginator),
			'menuOptions' => DataMenuEntity::query()
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
			'data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:varian_menu,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'harga_tambahan' => ['required', 'numeric', 'min:0'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('menu.varian-menu.index')
			->with('success', 'Varian menu berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:varian_menu,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'harga_tambahan' => ['required', 'numeric', 'min:0'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('menu.varian-menu.index')
			->with('success', 'Varian menu berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('menu.varian-menu.index')
			->with('success', 'Varian menu berhasil dihapus.');
	}
}
