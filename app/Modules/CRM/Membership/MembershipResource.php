<?php

namespace App\Modules\CRM\Membership;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MembershipResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('CRM/Membership/Index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('crm.membership.index');
	}
}
