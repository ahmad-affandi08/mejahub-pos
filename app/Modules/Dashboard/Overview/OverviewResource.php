<?php

namespace App\Modules\Dashboard\Overview;

use App\Http\Controllers\Controller;
use App\Modules\Dashboard\Overview\OverviewCollection;
use App\Modules\Dashboard\Overview\OverviewService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class OverviewResource extends Controller
{
    public function __construct(private readonly OverviewService $service)
    {
    }

    public function index(Request $request): Response|BinaryFileResponse|HttpResponse
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

        $overview = OverviewCollection::toDashboard($dashboard);

        $exportType = strtolower((string) $request->query('export', ''));

        if (in_array($exportType, ['pdf', 'excel'], true)) {
            $storeProfile = $this->service->storeProfileHeader();
            $fileName = $this->service->exportFileName('overview-dashboard', $overview['filters'] ?? [], $exportType);
            $tableHtml = $this->service->buildExportTableHtml($overview);

            if ($exportType === 'pdf') {
                $html = $this->service->renderPdfHtml($storeProfile, 'Overview Dashboard', $tableHtml, $overview['filters'] ?? []);

                return Pdf::loadHTML($html)
                    ->setPaper('a4', 'portrait')
                    ->download($fileName);
            }

            $html = $this->service->renderExcelHtml($storeProfile, 'Overview Dashboard', $tableHtml, $overview['filters'] ?? []);

            return response($html, 200, [
                'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);
        }

        return Inertia::render('Dashboard/Overview/Index', [
            'overview' => $overview,
            'summary' => $overview['master_summary'],
            'filters' => $overview['filters'],
        ]);
    }
}
