<?php

namespace App\Modules\POS\RefundPesanan;

use App\Http\Controllers\Controller;
use App\Support\PaymentMethodCatalog;
use App\Support\ApiResponder;
use App\Support\PosDomainException;
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
		$perPage = max(1, min((int) $request->query('per_page', 20), 100));
		$receiptLogs = $this->service->receiptHistory($search, $perPage);
		$receiptPayload = RefundPesananCollection::logs($receiptLogs->getCollection());
		$ordersPayload = RefundPesananCollection::orders($this->service->paidOrders($search));
		$pagination = [
			'current_page' => $receiptLogs->currentPage(),
			'last_page' => $receiptLogs->lastPage(),
			'per_page' => $receiptLogs->perPage(),
			'total' => $receiptLogs->total(),
		];

		if ($request->expectsJson()) {
			return ApiResponder::success('Data refund berhasil dimuat.', [
				'orders' => $ordersPayload,
				'receipts' => $receiptPayload,
				'logs' => $receiptPayload,
			], [
				'filters' => ['search' => $search, 'per_page' => $perPage],
				'pagination' => $pagination,
			]);
		}

		return Inertia::render('POS/RefundPesanan/Index', [
			'orders' => $ordersPayload,
			'receipts' => $receiptPayload,
			'logs' => $receiptPayload,
			'meta' => [
				'search' => $search,
				'per_page' => $perPage,
				'pagination' => $pagination,
			],
			'filters' => ['search' => $search, 'per_page' => $perPage],
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
			'metode' => ['required', 'string', PaymentMethodCatalog::inRule(PaymentMethodCatalog::POS_REFUND_METHOD_CODES)],
			'alasan' => ['required', 'string'],
		]);

		try {
			$log = $this->service->refundOrder(
				(int) $payload['pesanan_id'],
				(float) ($payload['nominal'] ?? 0),
				$payload['metode'],
				$payload['alasan'],
				auth()->id(),
			);
		} catch (PosDomainException $exception) {
			if ($request->expectsJson()) {
				return ApiResponder::error($exception->getMessage(), status: $exception->status());
			}

			return back()->withErrors(['general' => $exception->getMessage()]);
		}

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

	public function show(Request $request, int $id): JsonResponse|RedirectResponse
	{
		$log = RefundPesananEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->findOrFail($id);

		if ($request->expectsJson()) {
			return ApiResponder::success('Detail refund berhasil dimuat.', [
				'refund' => [
					'id' => $log->id,
					'kode' => $log->kode,
					'pesanan_id' => $log->pesanan_id,
					'nominal' => (float) $log->nominal,
					'metode' => $log->metode,
					'alasan' => $log->alasan,
					'status' => $log->status,
					'refunded_at' => optional($log->refunded_at)->toDateTimeString(),
				],
				'receipt' => RefundPesananCollection::toReceipt($log),
			]);
		}

		return redirect()
			->route('pos.refund-pesanan.index')
			->with('success', 'Detail refund siap ditampilkan.');
	}
}
