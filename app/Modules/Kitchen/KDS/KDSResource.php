<?php

namespace App\Modules\Kitchen\KDS;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class KDSResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('Kitchen/KDS/Index');
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
