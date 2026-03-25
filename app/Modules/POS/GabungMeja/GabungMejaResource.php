<?php

namespace App\Modules\POS\GabungMeja;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GabungMejaResource extends Controller
{
	public function __construct(private readonly GabungMejaService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$orders = $this->service->submittedOrders();
		$logs = $this->service->recentLogs();

		if ($request->expectsJson()) {
			return response()->json([
				'orders' => GabungMejaCollection::orders($orders),
				'logs' => GabungMejaCollection::logs($logs),
			]);
		}

		return Inertia::render('POS/GabungMeja/Index', [
			'orders' => GabungMejaCollection::orders($orders),
			'logs' => GabungMejaCollection::logs($logs),
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'pesanan_target_id' => ['required', 'integer', 'exists:pos_pesanan,id'],
			'pesanan_sumber_ids' => ['required', 'array', 'min:1'],
			'pesanan_sumber_ids.*' => ['required', 'integer', 'exists:pos_pesanan,id'],
			'catatan' => ['nullable', 'string'],
		]);

		$log = $this->service->mergeOrders(
			(int) $payload['pesanan_target_id'],
			$payload['pesanan_sumber_ids'],
			auth()->id(),
			$payload['catatan'] ?? null,
		);

		if ($request->expectsJson()) {
			return response()->json([
				'message' => 'Gabung meja berhasil diproses.',
				'data' => [
					'id' => $log->id,
				],
			], 201);
		}

		return redirect()
			->route('pos.gabung-meja.index')
			->with('success', 'Gabung meja berhasil diproses.');
	}
}
