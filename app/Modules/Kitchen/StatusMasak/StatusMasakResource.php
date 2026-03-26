<?php

namespace App\Modules\Kitchen\StatusMasak;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StatusMasakResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('Kitchen/StatusMasak/Index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('kitchen.status-masak.index');
	}
}
