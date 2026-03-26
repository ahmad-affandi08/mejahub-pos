<?php

namespace App\Modules\HR\Penggajian;

use App\Http\Controllers\Controller;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanGaji\PengaturanGajiService;
use App\Modules\HR\Penggajian\PenggajianCollection;
use App\Modules\HR\Penggajian\PenggajianService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PenggajianResource extends Controller
{
    public function __construct(
        private readonly PenggajianService $service,
        private readonly PengaturanGajiService $pengaturanGajiService,
    )
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $paginator = $this->service->paginate($search, $perPage);

        return Inertia::render('HR/Penggajian/Index', [
            'penggajian' => PenggajianCollection::toIndex($paginator),
            'pegawaiOptions' => DataPegawaiEntity::query()
                ->select(['id', 'nama', 'jabatan'])
                ->where('is_active', true)
                ->orderBy('nama')
                ->get(),
            'gajiPokokTemplatePerPegawai' => $this->pengaturanGajiService->getActiveMapByPegawaiId(),
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
        if ($request->boolean('generate_mode')) {
            $payload = $request->validate([
                'generate_mode' => ['required', 'boolean'],
                'pegawai_ids' => ['nullable', 'array'],
                'pegawai_ids.*' => ['integer', 'exists:data_pegawai,id'],
                'periode' => ['required', 'regex:/^\d{4}-\d{2}$/'],
                'tanggal_pembayaran' => ['nullable', 'date'],
                'hari_kerja' => ['required', 'array', 'min:1'],
                'hari_kerja.*' => ['integer', 'between:1,7'],
                'gaji_pokok_default' => ['required', 'numeric', 'min:0'],
                'gaji_pokok_per_pegawai' => ['nullable', 'array'],
                'gaji_pokok_per_pegawai.*' => ['nullable', 'numeric', 'min:0'],
                'gaji_pokok_per_jabatan' => ['nullable', 'array'],
                'gaji_pokok_per_jabatan.*' => ['nullable', 'numeric', 'min:0'],
                'tunjangan_default' => ['nullable', 'numeric', 'min:0'],
                'lembur_default' => ['nullable', 'numeric', 'min:0'],
                'bonus_default' => ['nullable', 'numeric', 'min:0'],
                'potongan_default' => ['nullable', 'numeric', 'min:0'],
                'potongan_per_alpha' => ['nullable', 'numeric', 'min:0'],
                'include_terlambat_penalty' => ['nullable', 'boolean'],
                'potongan_per_terlambat' => ['nullable', 'numeric', 'min:0'],
                'status' => ['required', 'in:draft,proses,dibayar,dibatalkan'],
                'kode_prefix' => ['nullable', 'string', 'max:20'],
                'catatan' => ['nullable', 'string'],
                'skip_existing' => ['nullable', 'boolean'],
                'is_active' => ['nullable', 'boolean'],
            ]);

            $payload['is_active'] = (bool) ($payload['is_active'] ?? true);

            $processed = $this->service->generateFromAbsensi($payload);

            return redirect()
                ->route('hr.penggajian.index')
                ->with('success', "Generate penggajian otomatis berhasil. {$processed} data diproses.");
        }

        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:penggajian,kode'],
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id'],
            'periode' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'tanggal_pembayaran' => ['nullable', 'date'],
            'gaji_pokok' => ['required', 'numeric', 'min:0'],
            'tunjangan' => ['nullable', 'numeric', 'min:0'],
            'lembur' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'potongan' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,proses,dibayar,dibatalkan'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $payload['is_active'] = (bool) ($payload['is_active'] ?? true);

        $this->service->create($payload);

        return redirect()
            ->route('hr.penggajian.index')
            ->with('success', 'Data penggajian berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $payload = $request->validate([
            'kode' => ['nullable', 'string', 'max:40', 'unique:penggajian,kode,' . $id],
            'pegawai_id' => ['required', 'integer', 'exists:data_pegawai,id'],
            'periode' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'tanggal_pembayaran' => ['nullable', 'date'],
            'gaji_pokok' => ['required', 'numeric', 'min:0'],
            'tunjangan' => ['nullable', 'numeric', 'min:0'],
            'lembur' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'potongan' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,proses,dibayar,dibatalkan'],
            'catatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $payload['is_active'] = (bool) ($payload['is_active'] ?? true);

        $this->service->update($id, $payload);

        return redirect()
            ->route('hr.penggajian.index')
            ->with('success', 'Data penggajian berhasil diperbarui.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return redirect()
            ->route('hr.penggajian.index')
            ->with('success', 'Data penggajian berhasil dihapus.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('hr.penggajian.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('hr.penggajian.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('hr.penggajian.index');
    }
}
