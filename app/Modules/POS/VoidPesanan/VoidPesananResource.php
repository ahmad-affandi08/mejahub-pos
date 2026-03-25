<?php

namespace App\Modules\POS\VoidPesanan;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VoidPesananResource extends Controller
{
	public function __construct(private readonly VoidPesananService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$search = trim((string) $request->query('search', ''));
		$orders = $this->service->eligibleOrders($search);
		$logs = $this->service->recentLogs();

		if ($request->expectsJson()) {
			return response()->json([
				'orders' => VoidPesananCollection::orders($orders),
				'logs' => VoidPesananCollection::logs($logs),
				'filters' => ['search' => $search],
			]);
		}

		return Inertia::render('POS/VoidPesanan/Index', [
			'orders' => VoidPesananCollection::orders($orders),
			'logs' => VoidPesananCollection::logs($logs),
			'filters' => ['search' => $search],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'pesanan_id' => ['required', 'integer', 'exists:pos_pesanan,id'],
			'alasan' => ['required', 'string'],
		]);

		$log = $this->service->voidOrder(
			(int) $payload['pesanan_id'],
			$payload['alasan'],
			auth()->id(),
		);

		if ($request->expectsJson()) {
			return response()->json([
				'message' => 'Pesanan berhasil di-void.',
				'data' => [
					'id' => $log->id,
					'kode' => $log->kode,
				],
			], 201);
		}

		return redirect()
			->route('pos.void-pesanan.index')
			->with('success', 'Pesanan berhasil di-void.');
	}
}
