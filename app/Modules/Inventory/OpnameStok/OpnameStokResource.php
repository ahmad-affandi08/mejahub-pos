<?php

namespace App\Modules\Inventory\OpnameStok;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpnameStokResource extends Controller
{
	public function __construct(private readonly OpnameStokService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/OpnameStok/Index', [
			'opnameStok' => OpnameStokCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_opname_stok,kode'],
			'tanggal_opname' => ['nullable', 'date'],
			'stok_fisik' => ['required', 'numeric', 'min:0'],
			'alasan' => ['nullable', 'string'],
			'status' => ['nullable', 'string', 'in:posted,draft,cancelled'],
		]);

		try {
			$this->service->create($payload, auth()->id());
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.opname-stok.index')
			->with('success', 'Opname stok berhasil diproses.');
	}

	public function destroy(int $id): RedirectResponse
	{
		try {
			$this->service->delete($id);
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.opname-stok.index')
			->with('success', 'Data opname stok berhasil dihapus.');
	}
}
