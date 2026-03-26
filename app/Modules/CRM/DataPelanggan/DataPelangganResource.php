<?php

namespace App\Modules\CRM\DataPelanggan;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataPelangganResource extends Controller
{
	public function __construct(private readonly DataPelangganService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('CRM/DataPelanggan/Index', [
			'pelanggan' => DataPelangganCollection::toIndex($paginator),
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
		return redirect()->route('crm.data-pelanggan.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('crm.data-pelanggan.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('crm.data-pelanggan.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('crm.data-pelanggan.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('crm.data-pelanggan.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('crm.data-pelanggan.index');
	}
}
