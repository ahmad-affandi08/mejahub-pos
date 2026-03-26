<?php

namespace App\Modules\CRM\DataPelanggan;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DataPelangganResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('CRM/DataPelanggan/Index');
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
