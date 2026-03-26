<?php

namespace App\Modules\Report\LaporanPajak;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanPajakResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('Report/LaporanPajak/Index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('report.laporan-pajak.index');
	}
}
