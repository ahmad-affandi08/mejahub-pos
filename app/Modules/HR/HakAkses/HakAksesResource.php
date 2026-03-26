<?php

namespace App\Modules\HR\HakAkses;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\HR\HakAkses\HakAksesCollection;
use App\Modules\HR\HakAkses\HakAksesService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
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
            'userOptions' => User::query()
                ->leftJoin('data_pegawai', 'users.id', '=', 'data_pegawai.user_id')
                ->select(['users.id', 'users.name', 'users.email', 'data_pegawai.jabatan'])
                ->orderBy('users.name')
                ->get(),
            'permissionCatalog' => $this->buildPermissionCatalog(),
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
            'kode' => ['required', 'string', 'max:50'],
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
            'kode' => ['required', 'string', 'max:50'],
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

    private function buildPermissionCatalog(): array
    {
        $modulesPath = app_path('Modules');

        if (!File::exists($modulesPath)) {
            return [];
        }

        return collect(File::directories($modulesPath))
            ->map(function (string $modulePath) {
                $moduleName = basename($modulePath);
                $moduleSlug = Str::kebab(Str::lower($moduleName));

                $items = collect(File::directories($modulePath))
                    ->map(function (string $featurePath) use ($moduleSlug) {
                        $featureName = basename($featurePath);
                        $featureSlug = Str::kebab($featureName);

                        return [
                            'key' => $moduleSlug . '.' . $featureSlug . '.access',
                            'label' => str_replace('-', ' ', $featureSlug),
                        ];
                    })
                    ->sortBy('label')
                    ->values()
                    ->all();

                return [
                    'module' => $moduleName,
                    'slug' => $moduleSlug,
                    'items' => $items,
                ];
            })
            ->sortBy('module')
            ->values()
            ->all();
    }
}
