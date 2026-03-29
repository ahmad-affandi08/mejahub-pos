<?php

namespace App\Modules\Inventory\ResepBOM;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Inventory\ResepBOM\ResepBOMEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResepBOMResource extends Controller
{
	public function __construct(private readonly ResepBOMService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$kategoriMenuId = $request->query('kategori_menu_id');
		$perPage = (int) $request->query('per_page', 12);
		$kategoriMenuId = is_numeric($kategoriMenuId) && (int) $kategoriMenuId > 0 ? (int) $kategoriMenuId : null;

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 12;
		$paginator = $this->service->paginateMenuCards($search, $kategoriMenuId, $perPage);

		return Inertia::render('Inventory/ResepBOM/Index', [
			'resepBOM' => ResepBOMCollection::toMenuCardIndex($paginator),
			'menuOptions' => DataMenuEntity::query()
				->select(['id', 'nama'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'bahanBakuOptions' => BahanBakuEntity::query()
				->select(['id', 'nama', 'satuan'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'categoryOptions' => KategoriMenuEntity::query()
				->select(['id', 'nama'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'filters' => [
				'search' => $search,
				'kategori_menu_id' => $kategoriMenuId,
				'per_page' => $perPage,
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function show(Request $request, int $id): Response
	{
		$detail = $this->service->menuDetail($id);

		if (!$detail) {
			abort(404, 'Menu tidak ditemukan.');
		}

		return Inertia::render('Inventory/ResepBOM/DetailResep', [
			'menu' => $detail['menu'],
			'resepItems' => collect($detail['items'])
				->map(fn (ResepBOMEntity $item) => ResepBOMCollection::toItem($item))
				->values()
				->all(),
			'menuOptions' => DataMenuEntity::query()
				->select(['id', 'nama'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'bahanBakuOptions' => BahanBakuEntity::query()
				->select(['id', 'nama', 'satuan'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'backFilters' => [
				'search' => trim((string) $request->query('search', '')),
				'kategori_menu_id' => $request->query('kategori_menu_id'),
				'page' => $request->query('page'),
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
			'bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_resep_bom,kode'],
			'qty_kebutuhan' => ['required', 'numeric', 'min:0.001'],
			'satuan' => ['nullable', 'string', 'max:30'],
			'referensi_porsi' => ['nullable', 'numeric', 'min:0.001'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['referensi_porsi'] = (float) ($payload['referensi_porsi'] ?? 1);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return back()->with('success', 'Resep BOM berhasil ditambahkan.');
	}

	public function storeBulk(Request $request): RedirectResponse
	{
		$payload = $request->validate([
			'data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.bahan_baku_id' => [
				'required',
				'integer',
				'exists:inventory_bahan_baku,id',
				'distinct',
				Rule::unique('inventory_resep_bom', 'bahan_baku_id')
					->where(fn ($query) => $query->where('data_menu_id', (int) $request->input('data_menu_id'))),
			],
			'items.*.kode' => ['nullable', 'string', 'max:40', 'distinct', 'unique:inventory_resep_bom,kode'],
			'items.*.qty_kebutuhan' => ['required', 'numeric', 'min:0.001'],
			'items.*.satuan' => ['nullable', 'string', 'max:30'],
			'items.*.referensi_porsi' => ['nullable', 'numeric', 'min:0.001'],
			'items.*.catatan' => ['nullable', 'string'],
			'items.*.is_active' => ['nullable', 'boolean'],
		]);

		$menuId = (int) $payload['data_menu_id'];
		$items = collect($payload['items'])
			->map(function (array $item) use ($menuId) {
				$item['data_menu_id'] = $menuId;
				$item['referensi_porsi'] = (float) ($item['referensi_porsi'] ?? 1);
				$item['is_active'] = (bool) ($item['is_active'] ?? true);

				return $item;
			})
			->values()
			->all();

		$this->service->createMany($items);

		return back()->with('success', count($items) . ' bahan resep berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_resep_bom,kode,' . $id],
			'qty_kebutuhan' => ['required', 'numeric', 'min:0.001'],
			'satuan' => ['nullable', 'string', 'max:30'],
			'referensi_porsi' => ['nullable', 'numeric', 'min:0.001'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['referensi_porsi'] = (float) ($payload['referensi_porsi'] ?? 1);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return back()->with('success', 'Resep BOM berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return back()->with('success', 'Resep BOM berhasil dihapus.');
	}
}
