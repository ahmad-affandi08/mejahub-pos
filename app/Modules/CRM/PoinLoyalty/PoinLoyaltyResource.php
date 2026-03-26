<?php

namespace App\Modules\CRM\PoinLoyalty;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PoinLoyaltyResource extends Controller
{
	public function __construct(private readonly PoinLoyaltyService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('CRM/PoinLoyalty/Index', [
			'poinLoyalty' => PoinLoyaltyCollection::toIndex($paginator),
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
		return redirect()->route('crm.poin-loyalty.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('crm.poin-loyalty.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('crm.poin-loyalty.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('crm.poin-loyalty.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('crm.poin-loyalty.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('crm.poin-loyalty.index');
	}
}
