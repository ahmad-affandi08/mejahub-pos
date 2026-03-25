<?php

namespace App\Modules\POS\RefundPesanan;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RefundPesananResource extends Controller
{
	public function __construct(private readonly RefundPesananService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$search = trim((string) $request->query('search', ''));
		$orders = $this->service->paidOrders($search);
		$logs = $this->service->recentLogs();

		if ($request->expectsJson()) {
			return ApiResponder::success('Data refund berhasil dimuat.', [
				'orders' => RefundPesananCollection::orders($orders),
				'logs' => RefundPesananCollection::logs($logs),
			], [
				'filters' => ['search' => $search],
			]);
		}

		return Inertia::render('POS/RefundPesanan/Index', [
			'orders' => RefundPesananCollection::orders($orders),
			'logs' => RefundPesananCollection::logs($logs),
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
			'nominal' => ['nullable', 'numeric', 'min:0'],
			'metode' => ['required', 'string', 'in:cash,transfer,qris,debit,credit'],
			'alasan' => ['required', 'string'],
		]);

		$log = $this->service->refundOrder(
			(int) $payload['pesanan_id'],
			(float) ($payload['nominal'] ?? 0),
			$payload['metode'],
			$payload['alasan'],
			auth()->id(),
		);

		if ($request->expectsJson()) {
			return ApiResponder::success('Refund berhasil diproses.', [
				'refund' => [
					'id' => $log->id,
					'kode' => $log->kode,
				],
				'receipt' => RefundPesananCollection::toReceipt($log),
			], [], 201);
		}

		return redirect()
			->route('pos.refund-pesanan.index')
			->with('success', 'Refund berhasil diproses.');
	}
}
