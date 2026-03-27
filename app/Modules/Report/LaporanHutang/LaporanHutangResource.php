<?php

namespace App\Modules\Report\LaporanHutang;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanHutangResource extends Controller
{
	public function __construct(private readonly LaporanHutangService $service) {}

	public function index(Request $request): Response|JsonResponse|HttpResponse
	{
		$dashboard = $this->service->buildDashboard();
		$payload = LaporanHutangCollection::toDashboard($dashboard);
		$filters = $dashboard['filters'] ?? [];

		$exportType = strtolower((string) $request->query('export', ''));
		if (in_array($exportType, ['pdf', 'excel'], true)) {
			$sp = $this->service->storeProfileHeader();
			$fn = $this->service->exportFileName('laporan-hutang', $filters, $exportType);
			$th = $this->service->buildExportTableHtml($payload);
			if ($exportType === 'pdf') { return Pdf::loadHTML($this->service->renderPdfHtml($sp, 'Laporan Hutang Supplier', $th, $filters))->setPaper('a4', 'portrait')->download($fn); }
			return response($this->service->renderExcelHtml($sp, 'Laporan Hutang Supplier', $th, $filters), 200, ['Content-Type' => 'application/vnd.ms-excel; charset=UTF-8', 'Content-Disposition' => 'attachment; filename="' . $fn . '"']);
		}

		if ($request->expectsJson()) return ApiResponder::success('OK', $payload);
		return Inertia::render('Report/LaporanHutang/Index', ['report' => $payload]);
	}

	public function create(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function store(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function show(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function edit(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function update(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function destroy(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	private function ro(Request $r): RedirectResponse|JsonResponse { if ($r->expectsJson()) return ApiResponder::error('Read-only.', status: 405); return redirect()->route('report.laporan-hutang.index'); }
}
