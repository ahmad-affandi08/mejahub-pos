<?php

namespace App\Modules\Settings\RecycleBin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecycleBinResource extends Controller
{
    public function __construct(private readonly RecycleBinService $service)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $module = trim((string) $request->query('module', ''));
        $perPage = (int) $request->query('per_page', 10);

        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $paginator = $this->service->paginate($search, $module, $perPage);

        return Inertia::render('Settings/RecycleBin/Index', [
            'recycleBin' => RecycleBinCollection::toIndex($paginator),
            'moduleOptions' => $this->service->getModuleOptions(),
            'filters' => [
                'search' => $search,
                'module' => $module,
                'per_page' => $perPage,
            ],
            'flashMessage' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $request->validate([
            'action' => ['required', 'in:restore,force_delete,force_delete_bulk'],
        ]);

        if ($payload['action'] === 'force_delete_bulk') {
            $bulkPayload = $request->validate([
                'items' => ['required', 'array', 'min:1'],
                'items.*.model_key' => ['required', 'string', 'max:120'],
                'items.*.record_id' => ['required', 'integer', 'min:1'],
            ]);

            $deletedCount = $this->service->forceDeleteBulk($bulkPayload['items']);

            return redirect()
                ->route('settings.recycle-bin.index')
                ->with('success', "{$deletedCount} data berhasil dihapus permanen.");
        }

        $singlePayload = $request->validate([
            'model_key' => ['required', 'string', 'max:120'],
            'record_id' => ['required', 'integer', 'min:1'],
        ]);

        if ($payload['action'] === 'restore') {
            $this->service->restore($singlePayload['model_key'], (int) $singlePayload['record_id']);

            return redirect()
                ->route('settings.recycle-bin.index')
                ->with('success', 'Data berhasil dipulihkan.');
        }

        $this->service->forceDelete($singlePayload['model_key'], (int) $singlePayload['record_id']);

        return redirect()
            ->route('settings.recycle-bin.index')
            ->with('success', 'Data berhasil dihapus permanen.');
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('settings.recycle-bin.index');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('settings.recycle-bin.index');
    }

    public function edit(): RedirectResponse
    {
        return redirect()->route('settings.recycle-bin.index');
    }

    public function update(): RedirectResponse
    {
        return redirect()->route('settings.recycle-bin.index');
    }

    public function destroy(): RedirectResponse
    {
        return redirect()->route('settings.recycle-bin.index');
    }
}
