<?php

namespace App\Modules\Inventory\ManajemenWaste;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManajemenWasteResource extends Controller
{
	public function __construct(private readonly ManajemenWasteService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/ManajemenWaste/Index', [
			'wasteLogs' => ManajemenWasteCollection::toIndex($paginator),
			'bahanBakuOptions' => BahanBakuEntity::query()->select(['id', 'nama', 'stok_saat_ini'])->where('is_active', true)->orderBy('nama')->get(),
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
			'bahan_baku_id' => ['required', 'integer', 'exists:inventory_bahan_baku,id'],
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_manajemen_waste,kode'],
			'tanggal_waste' => ['nullable', 'date'],
			'qty_waste' => ['required', 'numeric', 'min:0.001'],
			'kategori_waste' => ['nullable', 'string', 'max:50'],
			'alasan' => ['nullable', 'string'],
			'status' => ['nullable', 'string', 'in:posted,draft,cancelled'],
		]);

		try {
			$this->service->create($payload, auth()->id());
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.manajemen-waste.index')
			->with('success', 'Data waste berhasil diproses.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.manajemen-waste.index')
			->with('success', 'Data waste berhasil dihapus.');
	}
}
