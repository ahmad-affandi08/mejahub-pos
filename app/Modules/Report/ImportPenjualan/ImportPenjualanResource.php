<?php

namespace App\Modules\Report\ImportPenjualan;

use App\Http\Controllers\Controller;
use App\Modules\Report\ImportPenjualan\ImportPenjualanCollection;
use App\Modules\Report\ImportPenjualan\ImportPenjualanEntity;
use App\Modules\Report\ImportPenjualan\ImportPenjualanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ImportPenjualanResource extends Controller
{
    public function __construct(private readonly ImportPenjualanService $service)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $batchCode = trim((string) $request->query('batch_code', ''));
        $perPage = (int) $request->query('per_page', 20);
        $minOmzetLowMargin = (float) $request->query('min_omzet_low_margin', 0);

        $perPage = $perPage > 0 && $perPage <= 200 ? $perPage : 20;
        $paginator = $this->service->paginate($search, $batchCode, $perPage);
        $hppAnalysis = $this->service->buildHppAnalysis($batchCode, max(0, $minOmzetLowMargin));

        return Inertia::render('Report/ImportPenjualan/Index', [
            'imports' => ImportPenjualanCollection::toIndex($paginator),
            'batches' => $this->service->batchSummaries(12),
            'hppAnalysis' => $hppAnalysis,
            'filters' => [
                'search' => $search,
                'batch_code' => $batchCode,
                'per_page' => $perPage,
                'min_omzet_low_margin' => max(0, $minOmzetLowMargin),
            ],
            'flashMessage' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mode = trim((string) $request->input('mode', 'import'));

        if ($mode === 'delete_batch') {
            $payload = $request->validate([
                'mode' => ['required', 'in:delete_batch'],
                'batch_code' => ['required', 'string', 'max:60'],
            ]);

            $deleted = $this->service->deleteBatch((string) $payload['batch_code']);

            return redirect()
                ->route('report.import-penjualan.index')
                ->with('success', "Batch {$payload['batch_code']} dihapus. {$deleted} baris terhapus.");
        }

        $payload = $request->validate([
            'mode' => ['nullable', 'in:import'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:30720'],
        ], [
            'file.required' => 'File laporan penjualan wajib diupload.',
            'file.mimes' => 'Format file harus XLSX, XLS, CSV, atau TXT.',
            'file.max' => 'Ukuran file maksimal 30MB.',
        ]);

        try {
            $result = $this->service->importFromFile($payload['file']);
        } catch (\Throwable $exception) {
            return redirect()
                ->route('report.import-penjualan.index')
                ->with('error', 'Import gagal: ' . $exception->getMessage());
        }

        return redirect()
            ->route('report.import-penjualan.index')
            ->with('success', "Import berhasil. Batch {$result['batch_code']} | {$result['imported']} baris masuk, {$result['skipped']} baris dilewati.");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        return redirect()->route('report.import-penjualan.index');
    }

    public function destroy(int $id): RedirectResponse
    {
        $row = ImportPenjualanEntity::query()->findOrFail($id);
        $row->delete();

        return redirect()
            ->route('report.import-penjualan.index')
            ->with('success', 'Baris import berhasil dihapus.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('report.import-penjualan.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('report.import-penjualan.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('report.import-penjualan.index');
    }
}
