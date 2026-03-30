<?php

namespace App\Modules\Inventory\PenerimaanBarang;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\PurchaseOrder\PurchaseOrderEntity;
use App\Modules\Inventory\Supplier\SupplierEntity;
use App\Support\PaymentMethodCatalog;
use App\Support\PosDomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PenerimaanBarangResource extends Controller
{
	public function __construct(private readonly PenerimaanBarangService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/PenerimaanBarang/Index', [
			'penerimaanBarang' => PenerimaanBarangCollection::toIndex($paginator),
			'purchaseOrderOptions' => PurchaseOrderEntity::query()
				->select(['id', 'kode'])
				->whereIn('status', ['submitted', 'approved', 'partial'])
				->orderByDesc('id')
				->get(),
			'supplierOptions' => SupplierEntity::query()->select(['id', 'nama'])->where('is_active', true)->orderBy('nama')->get(),
			'bahanBakuOptions' => BahanBakuEntity::query()
				->select(['id', 'nama', 'satuan', 'satuan_kecil', 'satuan_besar', 'konversi_besar_ke_kecil', 'default_satuan_beli'])
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
			'purchase_order_id' => ['nullable', 'integer', 'exists:inventory_purchase_order,id'],
			'supplier_id' => ['nullable', 'integer', 'exists:inventory_supplier,id'],
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_penerimaan_barang,kode'],
			'nomor_surat_jalan' => ['nullable', 'string', 'max:60'],
			'tanggal_terima' => ['nullable', 'date'],
			'status' => ['nullable', 'string', 'in:received,partial,rejected'],
			'status_pembayaran' => ['nullable', 'string', 'in:unpaid,partial,paid'],
			'metode_pembayaran' => ['nullable', 'string', 'max:40', PaymentMethodCatalog::inRule(array_merge(PaymentMethodCatalog::FINANCE_METHOD_CODES, PaymentMethodCatalog::POS_REFUND_METHOD_CODES, ['tunai', 'transfer_bank']))],
			'akun_kas_id' => ['nullable', 'integer'],
			'jatuh_tempo' => ['nullable', 'date'],
			'jumlah_dibayar' => ['nullable', 'numeric', 'min:0'],
			'catatan' => ['nullable', 'string'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.purchase_order_item_id' => ['nullable', 'integer', 'exists:inventory_purchase_order_item,id'],
			'items.*.bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'items.*.qty_diterima' => ['required', 'numeric', 'min:0.001'],
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
			->route('inventory.penerimaan-barang.index')
			->with('success', 'Penerimaan barang berhasil disimpan.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.penerimaan-barang.index')
			->with('success', 'Penerimaan barang berhasil dihapus.');
	}
}
