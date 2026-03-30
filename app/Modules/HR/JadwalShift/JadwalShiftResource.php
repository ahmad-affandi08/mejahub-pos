<?php

namespace App\Modules\HR\JadwalShift;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanShift\PengaturanShiftEntity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class JadwalShiftResource extends Controller
{
    public function __construct(private readonly JadwalShiftService $service)
    {
    }

    public function index(Request $request): Response|BinaryFileResponse|HttpResponse
    {
        $search = trim((string) $request->query('search', ''));
        $month = trim((string) $request->query('month', ''));
        $dateFrom = trim((string) $request->query('date_from', ''));
        $dateTo = trim((string) $request->query('date_to', ''));
        $perPage = (int) $request->query('per_page', 10);
        $exportType = strtolower((string) $request->query('export', ''));

        if (in_array($exportType, ['pdf', 'excel'], true)) {
            $hasCustomRange = $dateFrom !== '' || $dateTo !== '';
            $exportMonth = $month !== '' ? $month : now()->format('Y-m');

            if ($hasCustomRange) {
                $matrix = $this->service->matrixByRange($dateFrom !== '' ? $dateFrom : null, $dateTo !== '' ? $dateTo : null, $search);
                $filters = $this->service->buildExportFiltersForRange($dateFrom !== '' ? $dateFrom : null, $dateTo !== '' ? $dateTo : null);
            } else {
                $matrix = $this->service->monthlyMatrix($exportMonth, $search);
                $filters = $this->service->buildExportFiltersForMonth($exportMonth);
            }

            $storeProfile = $this->service->storeProfileHeader();
            $fileName = $this->service->exportFileName('jadwal-shift', $filters, $exportType);
            $tableHtml = $this->service->buildExportMatrixHtml($matrix);

            if ($exportType === 'pdf') {
                $html = $this->service->renderPdfHtml($storeProfile, 'Laporan Jadwal Shift', $tableHtml, $filters);

                return Pdf::loadHTML($html)
                    ->setPaper('a3', 'landscape')
                    ->download($fileName);
            }

            $html = $this->service->renderExcelHtml($storeProfile, 'Laporan Jadwal Shift', $tableHtml, $filters);

            return response($html, 200, [
                'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);
        }

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $paginator = $this->service->paginate($search, $perPage, null);

        return Inertia::render('HR/JadwalShift/Index', [
            'jadwalShift' => JadwalShiftCollection::toIndex($paginator),
            'pegawaiOptions' => DataPegawaiEntity::query()->select(['id', 'nama', 'jabatan'])->where('is_active', true)->orderBy('nama')->get(),
            'shiftOptions' => PengaturanShiftEntity::query()->select(['id', 'nama', 'jam_masuk', 'jam_keluar'])->where('is_active', true)->orderBy('nama')->get(),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'flashMessage' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if ($request->boolean('is_copy')) {
            $payload = $request->validate([
                'tanggal_mulai_sumber' => ['required', 'date'],
                'tanggal_selesai_sumber' => ['required', 'date', 'after_or_equal:tanggal_mulai_sumber'],
                'tanggal_mulai_tujuan' => ['required', 'date'],
                'pegawai_ids' => ['nullable', 'array'],
                'pegawai_ids.*' => ['integer', 'exists:data_pegawai,id'],
            ]);

            return response()->json([
                'drafts' => $this->service->copyDraft($payload)
            ]);
        }

        $isGenerate = $request->boolean('generate_mode');

        if ($isGenerate) {
            $payload = $request->validate([
                'generate_mode' => ['required', 'boolean'],
                'pegawai_ids' => ['required', 'array', 'min:1'],
                'pegawai_ids.*' => ['integer', 'exists:data_pegawai,id'],
                'tanggal_mulai' => ['required', 'date'],
                'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
                'hari_kerja' => ['required', 'array', 'min:1'],
                'hari_kerja.*' => ['integer', 'between:1,7'],
                'status' => ['nullable', 'in:draft,published,libur'],
                'kode_prefix' => ['nullable', 'string', 'max:20'],
                'catatan' => ['nullable', 'string'],
                'skip_existing' => ['nullable', 'boolean'],
                'use_formula' => ['nullable', 'boolean'],
                'generate_libur' => ['nullable', 'boolean'],
                'is_draft' => ['nullable', 'boolean'],
            ]);

            if ($request->boolean('is_draft')) {
                return response()->json([
                    'drafts' => $this->service->generateDraft($payload)
                ]);
            }

            $created = $this->service->generate($payload);

            return redirect()
                ->route('hr.jadwal-shift.index')
                ->with('success', "Generate jadwal berhasil. {$created} jadwal dibuat.");
        }

        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:jadwal_shift,kode'],
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id'],
            'shift_id' => ['required', 'integer', 'exists:pengaturan_shift,id'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:draft,published,libur'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->create($payload);

        return redirect()->route('hr.jadwal-shift.index')->with('success', 'Jadwal shift berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:jadwal_shift,kode,' . $id],
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id'],
            'shift_id' => ['required', 'integer', 'exists:pengaturan_shift,id'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:draft,published,libur'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->update($id, $payload);

        return redirect()->route('hr.jadwal-shift.index')->with('success', 'Jadwal shift berhasil diperbarui.');
    }

    public function storeBulk(Request $request): HttpResponse
    {
        $payload = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id'],
            'items.*.tanggal' => ['required', 'date'],
            'items.*.shift_id' => ['nullable', 'integer', 'exists:pengaturan_shift,id'],
        ]);

        $this->service->saveBulk($payload['items']);

        return response()->json(['message' => 'Draft jadwal berhasil disimpan.']);
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return redirect()->route('hr.jadwal-shift.index')->with('success', 'Jadwal shift berhasil dihapus.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('hr.jadwal-shift.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('hr.jadwal-shift.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('hr.jadwal-shift.index');
    }
}
