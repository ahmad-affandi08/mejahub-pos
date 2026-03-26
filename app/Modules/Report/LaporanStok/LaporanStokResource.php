<?php

namespace App\Modules\Report\LaporanStok;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaporanStokResource extends Controller
{
	public function __construct(private readonly LaporanStokService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);
		$lowStockOnly = filter_var($request->query('low_stock_only', false), FILTER_VALIDATE_BOOL);

		$dashboard = $this->service->buildDashboard($search, $perPage, $lowStockOnly);
		$payload = LaporanStokCollection::toDashboard($dashboard);

		if ($request->expectsJson()) {
			return ApiResponder::success('Laporan stok berhasil dimuat.', $payload, [
				'filters' => [
					'search' => $search,
					'per_page' => $perPage,
					'low_stock_only' => $lowStockOnly,
				],
			]);
		}

		return Inertia::render('Report/LaporanStok/Index', [
			'report' => $payload,
			'filters' => [
				'search' => $search,
				'per_page' => $perPage,
				'low_stock_only' => $lowStockOnly,
			],
		]);
	}

	public function create(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	public function show(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	public function edit(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	public function update(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	public function destroy(Request $request): RedirectResponse|JsonResponse
	{
		return $this->readOnlyResponse($request);
	}

	private function readOnlyResponse(Request $request): RedirectResponse|JsonResponse
	{
		if ($request->expectsJson()) {
			return ApiResponder::error('Endpoint laporan stok bersifat read-only.', status: 405);
		}

		return redirect()->route('report.laporan-stok.index');
	}
}
