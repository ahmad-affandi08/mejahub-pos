<?php

namespace App\Modules\Inventory\ResepBOM;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/ResepBOM/Index', [
			'resepBOM' => ResepBOMCollection::toIndex($paginator),
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

		return redirect()
			->route('inventory.resep-b-o-m.index')
			->with('success', 'Resep BOM berhasil ditambahkan.');
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

		return redirect()
			->route('inventory.resep-b-o-m.index')
			->with('success', 'Resep BOM berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.resep-b-o-m.index')
			->with('success', 'Resep BOM berhasil dihapus.');
	}
}
