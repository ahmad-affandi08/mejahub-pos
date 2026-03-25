<?php

namespace App\Modules\Menu\ModifierMenu;

use App\Http\Controllers\Controller;
use App\Modules\Menu\ModifierMenu\ModifierMenuCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModifierMenuResource extends Controller
{
	public function __construct(private readonly ModifierMenuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Menu/ModifierMenu/Index', [
			'modifierMenu' => ModifierMenuCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:30', 'unique:modifier_menu,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'tipe' => ['required', 'string', 'in:single,multiple'],
			'min_pilih' => ['nullable', 'integer', 'min:0'],
			'max_pilih' => ['nullable', 'integer', 'min:1'],
			'opsi' => ['nullable', 'array'],
			'opsi.*' => ['string', 'max:120'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['min_pilih'] = (int) ($payload['min_pilih'] ?? 0);
		$payload['max_pilih'] = (int) ($payload['max_pilih'] ?? 1);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['opsi_json'] = json_encode(array_values(array_filter($payload['opsi'] ?? [])));
		unset($payload['opsi']);

		$this->service->create($payload);

		return redirect()
			->route('menu.modifier-menu.index')
			->with('success', 'Modifier menu berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:30', 'unique:modifier_menu,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'deskripsi' => ['nullable', 'string'],
			'tipe' => ['required', 'string', 'in:single,multiple'],
			'min_pilih' => ['nullable', 'integer', 'min:0'],
			'max_pilih' => ['nullable', 'integer', 'min:1'],
			'opsi' => ['nullable', 'array'],
			'opsi.*' => ['string', 'max:120'],
			'urutan' => ['nullable', 'integer', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['min_pilih'] = (int) ($payload['min_pilih'] ?? 0);
		$payload['max_pilih'] = (int) ($payload['max_pilih'] ?? 1);
		$payload['urutan'] = (int) ($payload['urutan'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['opsi_json'] = json_encode(array_values(array_filter($payload['opsi'] ?? [])));
		unset($payload['opsi']);

		$this->service->update($id, $payload);

		return redirect()
			->route('menu.modifier-menu.index')
			->with('success', 'Modifier menu berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('menu.modifier-menu.index')
			->with('success', 'Modifier menu berhasil dihapus.');
	}
}
