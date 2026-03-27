<?php

namespace App\Modules\Report\LaporanKeuangan;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanKeuanganResource extends Controller
{
	public function __construct(private readonly LaporanKeuanganService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse|HttpResponse
	{
		$periodType = (string) $request->query('period_type', 'daily');
		$referenceDate = (string) $request->query('reference_date', now()->toDateString());
		$dateFrom = $request->query('date_from');
		$dateTo = $request->query('date_to');

		$dashboard = $this->service->buildDashboard($periodType, $referenceDate, is_string($dateFrom) ? $dateFrom : null, is_string($dateTo) ? $dateTo : null);
		$payload = LaporanKeuanganCollection::toDashboard($dashboard);
		$filters = ['period_type' => $dashboard['filters']['period_type'] ?? 'daily', 'reference_date' => $dashboard['filters']['reference_date'] ?? now()->toDateString(), 'date_from' => $dashboard['filters']['date_from'] ?? null, 'date_to' => $dashboard['filters']['date_to'] ?? null, 'effective_range' => $dashboard['filters']['effective_range'] ?? null];

		$exportType = strtolower((string) $request->query('export', ''));
		if (in_array($exportType, ['pdf', 'excel'], true)) {
			$storeProfile = $this->service->storeProfileHeader();
			$fileName = $this->service->exportFileName('laporan-keuangan', $filters, $exportType);
			$tableHtml = $this->service->buildExportTableHtml($payload);

			if ($exportType === 'pdf') {
				$html = $this->service->renderPdfHtml($storeProfile, 'Laporan Keuangan', $tableHtml, $filters);
				return Pdf::loadHTML($html)->setPaper('a4', 'portrait')->download($fileName);
			}

			$html = $this->service->renderExcelHtml($storeProfile, 'Laporan Keuangan', $tableHtml, $filters);
			return response($html, 200, ['Content-Type' => 'application/vnd.ms-excel; charset=UTF-8', 'Content-Disposition' => 'attachment; filename="' . $fileName . '"']);
		}

		if ($request->expectsJson()) {
			return ApiResponder::success('Laporan keuangan berhasil dimuat.', $payload, ['filters' => $filters]);
		}

		return Inertia::render('Report/LaporanKeuangan/Index', ['report' => $payload, 'filters' => $filters]);
	}

	public function create(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function store(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function show(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function edit(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function update(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function destroy(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }

	private function ro(Request $r): RedirectResponse|JsonResponse
	{
		if ($r->expectsJson()) return ApiResponder::error('Read-only.', status: 405);
		return redirect()->route('report.laporan-keuangan.index');
	}
}
