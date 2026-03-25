<?php

namespace App\Modules\POS\Pembayaran;

use App\Http\Controllers\Controller;
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
		$pendingOrders = $this->service->pendingOrders($search);
		$activeShift = $this->service->activeShift(auth()->id());

		if ($request->expectsJson()) {
			return response()->json([
				'pending_orders' => $this->service->toOrderPayload($pendingOrders),
				'active_shift' => $activeShift ? [
					'id' => $activeShift->id,
					'kode' => $activeShift->kode,
					'status' => $activeShift->status,
				] : null,
				'filters' => ['search' => $search],
			]);
		}

		return Inertia::render('POS/Pembayaran/Index', [
			'pendingOrders' => $this->service->toOrderPayload($pendingOrders),
			'activeShift' => $activeShift ? [
				'id' => $activeShift->id,
				'kode' => $activeShift->kode,
				'status' => $activeShift->status,
			] : null,
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
			'metode_bayar' => ['required', 'string', 'in:cash,qris,debit,credit,transfer'],
			'nominal_dibayar' => ['required', 'numeric', 'min:0'],
			'catatan' => ['nullable', 'string'],
		]);

		$payment = $this->service->payOrder($payload, auth()->id());

		if ($request->expectsJson()) {
			return response()->json([
				'message' => 'Pembayaran berhasil diproses.',
				'data' => PembayaranCollection::toItem($payment),
			], 201);
		}

		return redirect()
			->route('pos.pembayaran.index')
			->with('success', 'Pembayaran berhasil diproses.');
	}
}
