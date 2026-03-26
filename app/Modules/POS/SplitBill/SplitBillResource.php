<?php

namespace App\Modules\POS\SplitBill;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use App\Support\PosDomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SplitBillResource extends Controller
{
	public function __construct(private readonly SplitBillService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$orders = $this->service->submittedOrders();
		$logs = $this->service->recentLogs();

		if ($request->expectsJson()) {
			return ApiResponder::success('Data split bill berhasil dimuat.', [
				'orders' => SplitBillCollection::orders($orders),
				'logs' => SplitBillCollection::logs($logs),
			]);
		}

		return Inertia::render('POS/SplitBill/Index', [
			'orders' => SplitBillCollection::orders($orders),
			'logs' => SplitBillCollection::logs($logs),
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'pesanan_id' => ['required', 'integer', 'exists:pos_pesanan,id'],
			'catatan' => ['nullable', 'string'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.pesanan_item_id' => ['required', 'integer', 'exists:pos_pesanan_item,id'],
			'items.*.qty' => ['required', 'integer', 'min:0'],
		]);

		try {
			$log = $this->service->splitOrder(
				(int) $payload['pesanan_id'],
				$payload['items'],
				auth()->id(),
				$payload['catatan'] ?? null,
			);
		} catch (PosDomainException $exception) {
			if ($request->expectsJson()) {
				return ApiResponder::error($exception->getMessage(), status: $exception->status());
			}

			return back()->withErrors(['general' => $exception->getMessage()]);
		}

		if ($request->expectsJson()) {
			return ApiResponder::success('Split bill berhasil diproses.', [
				'split_bill' => [
					'id' => $log->id,
				],
			], [], 201);
		}

		return redirect()
			->route('pos.split-bill.index')
			->with('success', 'Split bill berhasil diproses.');
	}
}
