<?php

namespace App\Modules\Menu\DataMenu;

use App\Http\Controllers\Controller;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DataMenuResource extends Controller
{
	public function __construct(private readonly DataMenuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Menu/DataMenu/Index', [
			'dataMenu' => DataMenuCollection::toIndex($paginator),
			'kategoriOptions' => KategoriMenuEntity::query()
				->select(['id', 'nama'])
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
			'kategori_menu_id' => ['required', 'integer', 'exists:kategori_menu,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:data_menu,kode'],
			'nama' => ['required', 'string', 'max:150'],
			'deskripsi' => ['nullable', 'string'],
			'harga' => ['required', 'numeric', 'min:0'],
			'gambar' => ['nullable', 'image', 'max:2048'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['gambar'] = $request->hasFile('gambar')
			? $this->storeImage($request->file('gambar'))
			: null;

		$this->service->create($payload);

		return redirect()
			->route('menu.data-menu.index')
			->with('success', 'Data menu berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$current = DataMenuEntity::query()->findOrFail($id);

		$payload = $request->validate([
			'kategori_menu_id' => ['required', 'integer', 'exists:kategori_menu,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:data_menu,kode,' . $id],
			'nama' => ['required', 'string', 'max:150'],
			'deskripsi' => ['nullable', 'string'],
			'harga' => ['required', 'numeric', 'min:0'],
			'gambar' => ['nullable', 'image', 'max:2048'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		if ($request->hasFile('gambar')) {
			$payload['gambar'] = $this->storeImage($request->file('gambar'));

			if (!empty($current->gambar)) {
				Storage::disk('public')->delete('menu/' . $current->gambar);
			}
		} else {
			unset($payload['gambar']);
		}

		$this->service->update($id, $payload);

		return redirect()
			->route('menu.data-menu.index')
			->with('success', 'Data menu berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$current = DataMenuEntity::query()->findOrFail($id);
		$this->service->delete($id);

		if (!empty($current->gambar)) {
			Storage::disk('public')->delete('menu/' . $current->gambar);
		}

		return redirect()
			->route('menu.data-menu.index')
			->with('success', 'Data menu berhasil dihapus.');
	}

	private function storeImage(UploadedFile $file): string
	{
		$filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
		Storage::disk('public')->putFileAs('menu', $file, $filename);

		return $filename;
	}
}
