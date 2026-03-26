<?php

namespace App\Modules\Inventory\TransferStok;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransferStokResource extends Controller
{
	public function __construct(private readonly TransferStokService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/TransferStok/Index', [
			'transferStok' => TransferStokCollection::toIndex($paginator),
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:inventory_transfer_stok,kode'],
			'tanggal_transfer' => ['nullable', 'date'],
			'lokasi_asal' => ['required', 'string', 'max:100'],
			'lokasi_tujuan' => ['required', 'string', 'max:100'],
			'qty_transfer' => ['required', 'numeric', 'min:0.001'],
			'catatan' => ['nullable', 'string'],
			'status' => ['nullable', 'string', 'in:posted,draft,cancelled'],
		]);

		try {
			$this->service->create($payload, auth()->id());
		} catch (PosDomainException $exception) {
			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		return redirect()
			->route('inventory.transfer-stok.index')
			->with('success', 'Transfer stok berhasil diproses.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('inventory.transfer-stok.index')
			->with('success', 'Data transfer stok berhasil dihapus.');
	}
}
