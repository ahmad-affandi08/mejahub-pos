<?php

namespace App\Modules\Report\LaporanPenjualan;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanPenjualanResource extends Controller
{
	public function __construct(private readonly LaporanPenjualanService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse|BinaryFileResponse|HttpResponse
	{
		$periodType = (string) $request->query('period_type', 'daily');
		$referenceDate = (string) $request->query('reference_date', now()->toDateString());
		$dateFrom = $request->query('date_from');
		$dateTo = $request->query('date_to');
		$topLimit = (int) $request->query('top_limit', 10);

		$dashboard = $this->service->buildDashboard(
			$periodType,
			$referenceDate,
			is_string($dateFrom) ? $dateFrom : null,
			is_string($dateTo) ? $dateTo : null,
			$topLimit,
		);

		$payload = LaporanPenjualanCollection::toDashboard($dashboard);

		$filters = [
			'period_type' => $dashboard['filters']['period_type'] ?? 'daily',
			'reference_date' => $dashboard['filters']['reference_date'] ?? now()->toDateString(),
			'date_from' => $dashboard['filters']['date_from'] ?? null,
			'date_to' => $dashboard['filters']['date_to'] ?? null,
			'top_limit' => $dashboard['filters']['top_limit'] ?? 10,
			'effective_range' => $dashboard['filters']['effective_range'] ?? null,
		];

		$exportType = strtolower((string) $request->query('export', ''));

		if (in_array($exportType, ['pdf', 'excel'], true)) {
			$storeProfile = $this->service->storeProfileHeader();
			$fileName = $this->service->exportFileName('laporan-penjualan', $filters, $exportType);
			$tableHtml = $this->service->buildExportTableHtml($payload);

			if ($exportType === 'pdf') {
				$html = $this->service->renderPdfHtml($storeProfile, 'Laporan Penjualan', $tableHtml, $filters);

				return Pdf::loadHTML($html)
					->setPaper('a4', 'portrait')
					->download($fileName);
			}

			$html = $this->service->renderExcelHtml($storeProfile, 'Laporan Penjualan', $tableHtml, $filters);

			return response($html, 200, [
				'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
				'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
			]);
		}

		if ($request->expectsJson()) {
			return ApiResponder::success('Laporan penjualan berhasil dimuat.', $payload, [
				'filters' => $filters,
			]);
		}

		return Inertia::render('Report/LaporanPenjualan/Index', [
			'report' => $payload,
			'filters' => $filters,
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
			return ApiResponder::error('Endpoint laporan penjualan bersifat read-only.', status: 405);
		}

		return redirect()->route('report.laporan-penjualan.index');
	}
}
