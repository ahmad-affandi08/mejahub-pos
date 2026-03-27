<?php

namespace App\Modules\HR\PengaturanGaji;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanGaji\PengaturanGajiCollection;
use App\Modules\HR\PengaturanGaji\PengaturanGajiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanGajiResource extends Controller
{
    public function __construct(private readonly PengaturanGajiService $service)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $paginator = $this->service->paginate($search, $perPage);

        return Inertia::render('HR/PengaturanGaji/Index', [
            'salaryTemplates' => PengaturanGajiCollection::toIndex($paginator),
            'pegawaiOptions' => DataPegawaiEntity::query()
                ->select(['id', 'nama', 'jabatan'])
                ->where('is_active', true)
                ->orderBy('nama')
                ->get(),
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
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id', 'unique:pengaturan_gaji_pegawai,pegawai_id'],
            'gaji_pokok' => ['required', 'numeric', 'min:0'],
            'kebijakan_penggajian' => ['nullable', 'array'],
            'kebijakan_penggajian.aktifkan_kebijakan' => ['nullable', 'boolean'],
            'kebijakan_penggajian.lembur_per_jam' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.lembur_min_menit' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'kebijakan_penggajian.potong_izin' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_izin' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_sakit' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_sakit' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_alpha' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_alpha' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_terlambat' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_terlambat' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->create($payload);

        return redirect()->route('hr.pengaturan-gaji.index')->with('success', 'Template gaji pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $payload = $request->validate([
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id', 'unique:pengaturan_gaji_pegawai,pegawai_id,' . $id],
            'gaji_pokok' => ['required', 'numeric', 'min:0'],
            'kebijakan_penggajian' => ['nullable', 'array'],
            'kebijakan_penggajian.aktifkan_kebijakan' => ['nullable', 'boolean'],
            'kebijakan_penggajian.lembur_per_jam' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.lembur_min_menit' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'kebijakan_penggajian.potong_izin' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_izin' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_sakit' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_sakit' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_alpha' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_alpha' => ['nullable', 'numeric', 'min:0'],
            'kebijakan_penggajian.potong_terlambat' => ['nullable', 'boolean'],
            'kebijakan_penggajian.potongan_per_terlambat' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->service->update($id, $payload);

        return redirect()->route('hr.pengaturan-gaji.index')->with('success', 'Template gaji pegawai berhasil diperbarui.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return redirect()->route('hr.pengaturan-gaji.index')->with('success', 'Template gaji pegawai berhasil dihapus.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-gaji.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-gaji.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('hr.pengaturan-gaji.index');
    }
}
