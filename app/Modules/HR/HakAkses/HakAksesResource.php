<?php

namespace App\Modules\HR\HakAkses;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\HR\HakAkses\HakAksesCollection;
use App\Modules\HR\HakAkses\HakAksesService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HakAksesResource extends Controller
{
    public function __construct(private readonly HakAksesService $service)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

        $paginator = $this->service->paginate($search, $perPage);

        return Inertia::render('HR/HakAkses/Index', [
            'hakAkses' => HakAksesCollection::toIndex($paginator),
            'userOptions' => User::query()->select(['id', 'name', 'email'])->orderBy('name')->get(),
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
            'kode' => ['required', 'string', 'max:50', 'unique:hak_akses,kode'],
            'nama' => ['required', 'string', 'max:120'],
            'deskripsi' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:120'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $this->service->create($payload);

        return redirect()
            ->route('hr.hak-akses.index')
            ->with('success', 'Role hak akses berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $payload = $request->validate([
            'kode' => ['required', 'string', 'max:50', 'unique:hak_akses,kode,' . $id],
            'nama' => ['required', 'string', 'max:120'],
            'deskripsi' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:120'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $this->service->update($id, $payload);

        return redirect()
            ->route('hr.hak-akses.index')
            ->with('success', 'Role hak akses berhasil diperbarui.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->service->delete($id);

        return redirect()
            ->route('hr.hak-akses.index')
            ->with('success', 'Role hak akses berhasil dihapus.');
    }
}
