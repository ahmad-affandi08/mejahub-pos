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
			'satuan' => ['nullable', 'string', 'max:30'],
			'satuan_kecil' => ['required', 'string', 'max:30'],
			'satuan_besar' => ['nullable', 'string', 'max:30'],
			'konversi_besar_ke_kecil' => ['nullable', 'numeric', 'min:1'],
			'default_satuan_beli' => ['nullable', 'string', 'max:30'],
			'harga_beli_terakhir' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum_input' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini_input' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum_unit' => ['nullable', 'string', 'max:30'],
			'stok_saat_ini_unit' => ['nullable', 'string', 'max:30'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['satuan'] = trim((string) ($payload['satuan_kecil'] ?? $payload['satuan'] ?? ''));
		$payload['satuan_kecil'] = $payload['satuan'];
		$payload['konversi_besar_ke_kecil'] = (float) ($payload['konversi_besar_ke_kecil'] ?? 1);
		$payload['default_satuan_beli'] = trim((string) ($payload['default_satuan_beli'] ?? $payload['satuan_kecil']));
		$payload['harga_beli_terakhir'] = (float) ($payload['harga_beli_terakhir'] ?? 0);
		$payload['stok_minimum'] = $this->toBaseUnitQty(
			$payload,
			(float) ($payload['stok_minimum_input'] ?? $payload['stok_minimum'] ?? 0),
			(string) ($payload['stok_minimum_unit'] ?? $payload['satuan_kecil'])
		);
		$payload['stok_saat_ini'] = $this->toBaseUnitQty(
			$payload,
			(float) ($payload['stok_saat_ini_input'] ?? $payload['stok_saat_ini'] ?? 0),
			(string) ($payload['stok_saat_ini_unit'] ?? $payload['satuan_kecil'])
		);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		unset(
			$payload['stok_minimum_input'],
			$payload['stok_saat_ini_input'],
			$payload['stok_minimum_unit'],
			$payload['stok_saat_ini_unit']
		);

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
			'satuan' => ['nullable', 'string', 'max:30'],
			'satuan_kecil' => ['required', 'string', 'max:30'],
			'satuan_besar' => ['nullable', 'string', 'max:30'],
			'konversi_besar_ke_kecil' => ['nullable', 'numeric', 'min:1'],
			'default_satuan_beli' => ['nullable', 'string', 'max:30'],
			'harga_beli_terakhir' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum_input' => ['nullable', 'numeric', 'min:0'],
			'stok_saat_ini_input' => ['nullable', 'numeric', 'min:0'],
			'stok_minimum_unit' => ['nullable', 'string', 'max:30'],
			'stok_saat_ini_unit' => ['nullable', 'string', 'max:30'],
			'keterangan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['satuan'] = trim((string) ($payload['satuan_kecil'] ?? $payload['satuan'] ?? ''));
		$payload['satuan_kecil'] = $payload['satuan'];
		$payload['konversi_besar_ke_kecil'] = (float) ($payload['konversi_besar_ke_kecil'] ?? 1);
		$payload['default_satuan_beli'] = trim((string) ($payload['default_satuan_beli'] ?? $payload['satuan_kecil']));
		$payload['harga_beli_terakhir'] = (float) ($payload['harga_beli_terakhir'] ?? 0);
		$payload['stok_minimum'] = $this->toBaseUnitQty(
			$payload,
			(float) ($payload['stok_minimum_input'] ?? $payload['stok_minimum'] ?? 0),
			(string) ($payload['stok_minimum_unit'] ?? $payload['satuan_kecil'])
		);
		$payload['stok_saat_ini'] = $this->toBaseUnitQty(
			$payload,
			(float) ($payload['stok_saat_ini_input'] ?? $payload['stok_saat_ini'] ?? 0),
			(string) ($payload['stok_saat_ini_unit'] ?? $payload['satuan_kecil'])
		);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		unset(
			$payload['stok_minimum_input'],
			$payload['stok_saat_ini_input'],
			$payload['stok_minimum_unit'],
			$payload['stok_saat_ini_unit']
		);

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

	private function toBaseUnitQty(array $payload, float $qtyInput, string $unitInput): float
	{
		$qty = max(0, $qtyInput);
		$satuanKecil = strtolower(trim((string) ($payload['satuan_kecil'] ?? $payload['satuan'] ?? '')));
		$satuanBesar = strtolower(trim((string) ($payload['satuan_besar'] ?? '')));
		$unit = strtolower(trim($unitInput));

		if ($satuanBesar !== '' && $unit === $satuanBesar) {
			$konversi = max(1, (float) ($payload['konversi_besar_ke_kecil'] ?? 1));
			return round($qty * $konversi, 3);
		}

		if ($satuanKecil === '' || $unit === '' || $unit === $satuanKecil) {
			return round($qty, 3);
		}

		return round($qty, 3);
	}
}
