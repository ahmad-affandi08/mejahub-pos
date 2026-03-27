<?php

namespace App\Modules\Report\LaporanPerformaMenu;

use App\Http\Controllers\Controller;
use App\Support\ApiResponder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class LaporanPerformaMenuResource extends Controller
{
	public function __construct(private readonly LaporanPerformaMenuService $service) {}

	public function index(Request $request): Response|JsonResponse|HttpResponse
	{
		$d = $this->service->buildDashboard((string) $request->query('period_type', 'daily'), (string) $request->query('reference_date', now()->toDateString()), is_string($request->query('date_from')) ? $request->query('date_from') : null, is_string($request->query('date_to')) ? $request->query('date_to') : null, (int) $request->query('top_limit', 10));
		$p = LaporanPerformaMenuCollection::toDashboard($d);
		$f = ['period_type' => $d['filters']['period_type'] ?? 'daily', 'reference_date' => $d['filters']['reference_date'] ?? now()->toDateString(), 'date_from' => $d['filters']['date_from'] ?? null, 'date_to' => $d['filters']['date_to'] ?? null, 'top_limit' => $d['filters']['top_limit'] ?? 10, 'effective_range' => $d['filters']['effective_range'] ?? null];

		$exportType = strtolower((string) $request->query('export', ''));
		if (in_array($exportType, ['pdf', 'excel'], true)) {
			$sp = $this->service->storeProfileHeader();
			$fn = $this->service->exportFileName('laporan-performa-menu', $f, $exportType);
			$th = $this->service->buildExportTableHtml($p);
			if ($exportType === 'pdf') { return Pdf::loadHTML($this->service->renderPdfHtml($sp, 'Laporan Performa Menu', $th, $f))->setPaper('a4', 'landscape')->download($fn); }
			return response($this->service->renderExcelHtml($sp, 'Laporan Performa Menu', $th, $f), 200, ['Content-Type' => 'application/vnd.ms-excel; charset=UTF-8', 'Content-Disposition' => 'attachment; filename="' . $fn . '"']);
		}

		if ($request->expectsJson()) return ApiResponder::success('OK', $p, ['filters' => $f]);
		return Inertia::render('Report/LaporanPerformaMenu/Index', ['report' => $p, 'filters' => $f]);
	}

	public function create(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function store(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function show(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function edit(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function update(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	public function destroy(Request $r): RedirectResponse|JsonResponse { return $this->ro($r); }
	private function ro(Request $r): RedirectResponse|JsonResponse { if ($r->expectsJson()) return ApiResponder::error('Read-only.', status: 405); return redirect()->route('report.laporan-performa-menu.index'); }
}
