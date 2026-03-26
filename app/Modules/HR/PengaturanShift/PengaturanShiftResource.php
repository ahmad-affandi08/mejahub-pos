<?php

namespace App\Modules\HR\PengaturanShift;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanShiftResource extends Controller
{
    public function __construct(private readonly PengaturanShiftService $service)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $paginator = $this->service->paginate($search, $perPage);

        return Inertia::render('HR/PengaturanShift/Index', [
            'shiftSettings' => PengaturanShiftCollection::toIndex($paginator),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'flashMessage' => [
                'success' => $request->session()->get('success'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:pengaturan_shift,kode'],
            'nama' => ['required', 'string', 'max:120'],
            'jam_masuk' => ['required', 'date_format:H:i'],
            'jam_keluar' => ['required', 'date_format:H:i'],
            'toleransi_telat_menit' => ['nullable', 'integer', 'min:0'],
            'toleransi_pulang_cepat_menit' => ['nullable', 'integer', 'min:0'],
            'lintas_hari' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_meter' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'require_face_verification' => ['nullable', 'boolean'],
            'require_location_validation' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->create($payload);

        return redirect()->route('hr.pengaturan-shift.index')->with('success', 'Pengaturan shift berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:pengaturan_shift,kode,' . $id],
            'nama' => ['required', 'string', 'max:120'],
            'jam_masuk' => ['required', 'date_format:H:i'],
            'jam_keluar' => ['required', 'date_format:H:i'],
            'toleransi_telat_menit' => ['nullable', 'integer', 'min:0'],
            'toleransi_pulang_cepat_menit' => ['nullable', 'integer', 'min:0'],
            'lintas_hari' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_meter' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'require_face_verification' => ['nullable', 'boolean'],
            'require_location_validation' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->update($id, $payload);

        return redirect()->route('hr.pengaturan-shift.index')->with('success', 'Pengaturan shift berhasil diperbarui.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return redirect()->route('hr.pengaturan-shift.index')->with('success', 'Pengaturan shift berhasil dihapus.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-shift.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-shift.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-shift.index');
    }
}
