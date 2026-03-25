<?php

namespace App\Modules\POS\TutupShift;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TutupShiftResource extends Controller
{
	public function __construct(private readonly TutupShiftService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$activeShift = $this->service->activeShift(auth()->id());
		$summary = $activeShift ? $this->service->shiftSummary($activeShift) : null;

		if ($request->expectsJson()) {
			return ApiResponder::success('Data tutup shift berhasil dimuat.', [
				'active_shift' => $activeShift ? TutupShiftCollection::toItem(TutupShiftEntity::fromShift($activeShift)) : null,
				'summary' => $summary,
			]);
		}

		return Inertia::render('POS/TutupShift/Index', [
			'activeShift' => $activeShift ? TutupShiftCollection::toItem(TutupShiftEntity::fromShift($activeShift)) : null,
			'summary' => $summary,
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$activeShift = $this->service->activeShift(auth()->id());

		if (!$activeShift) {
			$message = 'Tidak ada shift aktif untuk ditutup.';

			if ($request->expectsJson()) {
				return ApiResponder::error($message);
			}

			return back()->withErrors(['kas_aktual' => $message]);
		}

		$payload = $request->validate([
			'kas_aktual' => ['required', 'numeric', 'min:0'],
			'catatan_tutup' => ['nullable', 'string'],
		]);

		$closed = $this->service->closeShift($activeShift, $payload);

		if ($request->expectsJson()) {
			return ApiResponder::success('Shift berhasil ditutup.', [
				'shift' => TutupShiftCollection::toItem($closed),
			]);
		}

		return redirect()
			->route('pos.tutup-shift.index')
			->with('success', 'Shift berhasil ditutup.');
	}
}
