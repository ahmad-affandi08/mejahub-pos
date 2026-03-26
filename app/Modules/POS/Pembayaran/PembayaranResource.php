<?php

namespace App\Modules\POS\Pembayaran;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use App\Support\PosDomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PembayaranResource extends Controller
{
	public function __construct(private readonly PembayaranService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 20);
		$pendingOrders = $this->service->pendingOrders($search);
		$activeShift = $this->service->activeShift(auth()->id());
		$receiptHistory = $this->service->receiptHistory($search, $perPage);
		$paymentConfig = $this->service->paymentConfiguration();
		$recentPayments = $receiptHistory->getCollection();
		$paymentPayload = $recentPayments->map(fn (PembayaranEntity $item) => PembayaranCollection::toListItem($item))->all();

		if ($request->expectsJson()) {
			return ApiResponder::success('Data pembayaran berhasil dimuat.', [
				'pending_orders' => $this->service->toOrderPayload($pendingOrders),
				'active_shift' => $activeShift ? [
					'id' => $activeShift->id,
					'kode' => $activeShift->kode,
					'status' => $activeShift->status,
				] : null,
				'payment_config' => $paymentConfig,
				'recent_payments' => $paymentPayload,
			], [
				'filters' => ['search' => $search, 'per_page' => $perPage],
				'pagination' => [
					'current_page' => $receiptHistory->currentPage(),
					'last_page' => $receiptHistory->lastPage(),
					'per_page' => $receiptHistory->perPage(),
					'total' => $receiptHistory->total(),
				],
			]);
		}

		return Inertia::render('POS/Pembayaran/Index', [
			'pendingOrders' => $this->service->toOrderPayload($pendingOrders),
			'activeShift' => $activeShift ? [
				'id' => $activeShift->id,
				'kode' => $activeShift->kode,
				'status' => $activeShift->status,
			] : null,
			'paymentConfig' => $paymentConfig,
			'recentPayments' => $paymentPayload,
			'filters' => ['search' => $search, 'per_page' => $perPage],
			'pagination' => [
				'current_page' => $receiptHistory->currentPage(),
				'last_page' => $receiptHistory->lastPage(),
				'per_page' => $receiptHistory->perPage(),
				'total' => $receiptHistory->total(),
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'pesanan_id' => ['required', 'integer', 'exists:pos_pesanan,id'],
			'metode_bayar' => ['nullable', 'string', 'max:30'],
			'nominal_dibayar' => ['nullable', 'numeric', 'min:0'],
			'payment_details' => ['nullable', 'array', 'min:1'],
			'payment_details.*.metode_bayar' => ['required_with:payment_details', 'string', 'max:30'],
			'payment_details.*.nominal' => ['required_with:payment_details', 'numeric', 'min:0'],
			'catatan' => ['nullable', 'string'],
		]);

		try {
			$payment = $this->service->payOrder($payload, auth()->id());
			$payment = $payment->load(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name']);
		} catch (PosDomainException $exception) {
			if ($request->expectsJson()) {
				return ApiResponder::error($exception->getMessage(), status: $exception->status());
			}

			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		if ($request->expectsJson()) {
			return ApiResponder::success('Pembayaran berhasil diproses.', [
				'payment' => PembayaranCollection::toItem($payment),
				'receipt' => PembayaranCollection::toReceipt($payment),
			], [], 201);
		}

		return redirect()
			->route('pos.pembayaran.index')
			->with('success', 'Pembayaran berhasil diproses.');
	}

	public function show(Request $request, int $id): JsonResponse|RedirectResponse
	{
		$payment = PembayaranEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->findOrFail($id);

		if ($request->expectsJson()) {
			return ApiResponder::success('Detail pembayaran berhasil dimuat.', [
				'payment' => PembayaranCollection::toItem($payment),
				'receipt' => PembayaranCollection::toReceipt($payment),
			]);
		}

		return redirect()
			->route('pos.pembayaran.index')
			->with('success', 'Detail pembayaran siap ditampilkan.');
	}
}
