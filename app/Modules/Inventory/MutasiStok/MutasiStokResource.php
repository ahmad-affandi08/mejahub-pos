<?php

namespace App\Modules\Inventory\MutasiStok;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutasiStokResource extends Controller
{
	public function __construct(private readonly MutasiStokService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Inventory/MutasiStok/Index', [
			'mutasiStok' => MutasiStokCollection::toIndex($paginator),
			'filters' => [
				'search' => $search,
				'per_page' => $perPage,
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('inventory.mutasi-stok.index');
	}
}
