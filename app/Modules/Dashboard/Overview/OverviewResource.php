<?php

namespace App\Modules\Dashboard\Overview;

use App\Http\Controllers\Controller;
use App\Modules\Dashboard\Overview\OverviewCollection;
use App\Modules\Dashboard\Overview\OverviewService;
use Inertia\Inertia;
use Inertia\Response;

class OverviewResource extends Controller
{
    public function __construct(private readonly OverviewService $service)
    {
    }

    public function index(): Response
    {
        $summary = $this->service->getSummary();

        return Inertia::render('Dashboard/Overview/Index', [
            'summary' => OverviewCollection::toSummary($summary),
        ]);
    }
}
