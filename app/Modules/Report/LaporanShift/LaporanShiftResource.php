<?php

namespace App\Modules\Report\LaporanShift;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanShiftResource extends Controller
{
	public function index(): Response
	{
		return Inertia::render('Report/LaporanShift/Index');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}

	public function store(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}

	public function update(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}

	public function destroy(): RedirectResponse
	{
		return redirect()->route('report.laporan-shift.index');
	}
}
