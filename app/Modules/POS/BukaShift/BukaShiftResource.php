<?php

namespace App\Modules\POS\BukaShift;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BukaShiftResource extends Controller
{
	public function __construct(private readonly BukaShiftService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$activeShift = $this->service->activeShift(auth()->id());
		$recentShifts = $this->service->recentShifts();

		if ($request->expectsJson()) {
			return ApiResponder::success('Data buka shift berhasil dimuat.', [
				'active_shift' => $activeShift ? BukaShiftCollection::toItem($activeShift) : null,
				'recent_shifts' => $recentShifts->map(fn (BukaShiftEntity $item) => BukaShiftCollection::toItem($item))->all(),
			]);
		}

		return Inertia::render('POS/BukaShift/Index', [
			'activeShift' => $activeShift ? BukaShiftCollection::toItem($activeShift) : null,
			'recentShifts' => $recentShifts->map(fn (BukaShiftEntity $item) => BukaShiftCollection::toItem($item))->all(),
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		if ($this->service->activeShift(auth()->id())) {
			$message = 'Masih ada shift aktif. Tutup shift sebelumnya terlebih dahulu.';

			if ($request->expectsJson()) {
				return ApiResponder::error($message);
			}

			return back()->withErrors(['kas_awal' => $message]);
		}

		$payload = $request->validate([
			'kas_awal' => ['required', 'numeric', 'min:0'],
			'catatan_buka' => ['nullable', 'string'],
		]);

		$shift = $this->service->openShift($payload, auth()->id());

		if ($request->expectsJson()) {
			return ApiResponder::success('Shift berhasil dibuka.', [
				'shift' => BukaShiftCollection::toItem($shift),
			], [], 201);
		}

		return redirect()
			->route('pos.buka-shift.index')
			->with('success', 'Shift berhasil dibuka.');
	}
}
