<?php

namespace App\Modules\CRM\PoinLoyalty;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PoinLoyaltyResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('CRM/PoinLoyalty/Index');
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
