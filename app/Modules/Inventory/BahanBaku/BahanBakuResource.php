<?php

namespace App\Modules\Inventory\BahanBaku;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Supplier\SupplierEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BahanBakuResource extends Controller
{
	public function __construct(private readonly BahanBakuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/BahanBaku/Index', [
			'bahanBaku' => BahanBakuCollection::toIndex($paginator),
			'supplierOptions' => SupplierEntity::query()
				->select(['id', 'nama'])
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
			'supplier_id' => ['nullable', 'integer', 'exists:inventory_supplier,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:inventory_bahan_baku,kode'],
			'nama' => ['required', 'string', 'max:150'],
			'satuan' => ['required', 'string', 'max:30'],
			'harga_beli_terakhir' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini' => ['nullable', 'numeric', 'min:0'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['harga_beli_terakhir'] = (float) ($payload['harga_beli_terakhir'] ?? 0);
		$payload['stok_minimum'] = (float) ($payload['stok_minimum'] ?? 0);
		$payload['stok_saat_ini'] = (float) ($payload['stok_saat_ini'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->create($payload);

		return redirect()
			->route('inventory.bahan-baku.index')
			->with('success', 'Bahan baku berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'supplier_id' => ['nullable', 'integer', 'exists:inventory_supplier,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:inventory_bahan_baku,kode,' . $id],
			'nama' => ['required', 'string', 'max:150'],
			'satuan' => ['required', 'string', 'max:30'],
			'harga_beli_terakhir' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini' => ['nullable', 'numeric', 'min:0'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['harga_beli_terakhir'] = (float) ($payload['harga_beli_terakhir'] ?? 0);
		$payload['stok_minimum'] = (float) ($payload['stok_minimum'] ?? 0);
		$payload['stok_saat_ini'] = (float) ($payload['stok_saat_ini'] ?? 0);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->update($id, $payload);

		return redirect()
			->route('inventory.bahan-baku.index')
			->with('success', 'Bahan baku berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.bahan-baku.index')
			->with('success', 'Bahan baku berhasil dihapus.');
	}
}
