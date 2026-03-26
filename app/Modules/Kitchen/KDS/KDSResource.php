<?php

namespace App\Modules\Kitchen\KDS;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KDSResource extends Controller
{
	public function __construct(private readonly KDSService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Kitchen/KDS/Index', [
			'kds' => KDSCollection::toIndex($paginator),
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
		return redirect()->route('kitchen.k-d-s.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('kitchen.k-d-s.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('kitchen.k-d-s.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('kitchen.k-d-s.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('kitchen.k-d-s.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('kitchen.k-d-s.index');
	}
}
