<?php

namespace App\Modules\Inventory\PurchaseOrder;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\Supplier\SupplierEntity;
use App\Support\PosDomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderResource extends Controller
{
	public function __construct(private readonly PurchaseOrderService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$status = trim((string) $request->query('status', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $status, $perPage);

		return Inertia::render('Inventory/PurchaseOrder/Index', [
			'purchaseOrders' => PurchaseOrderCollection::toIndex($paginator),
			'supplierOptions' => SupplierEntity::query()->select(['id', 'nama'])->where('is_active', true)->orderBy('nama')->get(),
			'bahanBakuOptions' => BahanBakuEntity::query()
				->select(['id', 'nama', 'satuan', 'satuan_kecil', 'satuan_besar', 'konversi_besar_ke_kecil', 'default_satuan_beli'])
				->where('is_active', true)
				->orderBy('nama')
				->get(),
			'filters' => [
				'search' => $search,
				'status' => $status,
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_purchase_order,kode'],
			'tanggal_po' => ['nullable', 'date'],
			'status' => ['nullable', 'string', 'in:draft,submitted,approved,partial,received,cancelled'],
			'catatan' => ['nullable', 'string'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'items.*.qty_pesan' => ['required', 'numeric', 'min:0.001'],
			'items.*.qty_input' => ['nullable', 'numeric', 'min:0.001'],
			'items.*.satuan_input' => ['nullable', 'string', 'max:30'],
			'items.*.harga_satuan' => ['required', 'numeric', 'min:0'],
			'items.*.catatan' => ['nullable', 'string'],
		]);

		try {
			$this->service->create($payload, auth()->id());
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.purchase-order.index')
			->with('success', 'Purchase order berhasil dibuat.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'supplier_id' => ['nullable', 'integer', 'exists:inventory_supplier,id'],
			'tanggal_po' => ['nullable', 'date'],
			'status' => ['nullable', 'string', 'in:draft,submitted,approved,partial,received,cancelled'],
			'catatan' => ['nullable', 'string'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'items.*.qty_pesan' => ['required', 'numeric', 'min:0.001'],
			'items.*.qty_input' => ['nullable', 'numeric', 'min:0.001'],
			'items.*.satuan_input' => ['nullable', 'string', 'max:30'],
			'items.*.harga_satuan' => ['required', 'numeric', 'min:0'],
			'items.*.catatan' => ['nullable', 'string'],
		]);

		try {
			$this->service->update($id, $payload);
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.purchase-order.index')
			->with('success', 'Purchase order berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.purchase-order.index')
			->with('success', 'Purchase order berhasil dihapus.');
	}
}
