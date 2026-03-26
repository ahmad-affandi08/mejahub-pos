<?php

namespace App\Modules\Inventory\Supplier;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierResource extends Controller
{
	public function __construct(private readonly SupplierService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/Supplier/Index', [
			'suppliers' => SupplierCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:30', 'unique:inventory_supplier,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'kontak_pic' => ['nullable', 'string', 'max:120'],
			'telepon' => ['nullable', 'string', 'max:30'],
			'email' => ['nullable', 'email', 'max:120'],
			'alamat' => ['nullable', 'string'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->create($payload);

		return redirect()
			->route('inventory.supplier.index')
			->with('success', 'Supplier berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['nullable', 'string', 'max:30', 'unique:inventory_supplier,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'kontak_pic' => ['nullable', 'string', 'max:120'],
			'telepon' => ['nullable', 'string', 'max:30'],
			'email' => ['nullable', 'email', 'max:120'],
			'alamat' => ['nullable', 'string'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->update($id, $payload);

		return redirect()
			->route('inventory.supplier.index')
			->with('success', 'Supplier berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.supplier.index')
			->with('success', 'Supplier berhasil dihapus.');
	}
}
