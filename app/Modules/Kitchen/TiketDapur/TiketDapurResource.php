<?php

namespace App\Modules\Kitchen\TiketDapur;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TiketDapurResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('Kitchen/TiketDapur/Index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('kitchen.tiket-dapur.index');
	}
}
