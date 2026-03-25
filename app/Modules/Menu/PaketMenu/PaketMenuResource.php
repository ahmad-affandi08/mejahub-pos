<?php

namespace App\Modules\Menu\PaketMenu;

use App\Http\Controllers\Controller;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Menu\PaketMenu\PaketMenuCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaketMenuResource extends Controller
{
	public function __construct(private readonly PaketMenuService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Menu/PaketMenu/Index', [
			'paketMenu' => PaketMenuCollection::toIndex($paginator),
			'kategoriOptions' => KategoriMenuEntity::query()
				->select(['id', 'nama'])
				->orderBy('nama')
				->get(),
			'menuOptions' => DataMenuEntity::query()
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
		$payload = $this->validatePayload($request, null);
		$this->service->create($payload);

		return redirect()
			->route('menu.paket-menu.index')
			->with('success', 'Paket menu berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $this->validatePayload($request, $id);
		$this->service->update($id, $payload);

		return redirect()
			->route('menu.paket-menu.index')
			->with('success', 'Paket menu berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('menu.paket-menu.index')
			->with('success', 'Paket menu berhasil dihapus.');
	}

	private function validatePayload(Request $request, ?int $id): array
	{
		$uniqueRule = 'unique:paket_menu,kode';

		if ($id !== null) {
			$uniqueRule = $uniqueRule . ',' . $id;
		}

		$payload = $request->validate([
			'kategori_menu_id' => ['nullable', 'integer', 'exists:kategori_menu,id'],
			'kode' => ['nullable', 'string', 'max:30', $uniqueRule],
			'nama' => ['required', 'string', 'max:150'],
			'deskripsi' => ['nullable', 'string'],
			'harga_paket' => ['required', 'numeric', 'min:0'],
			'is_active' => ['nullable', 'boolean'],
			'item_rows' => ['nullable', 'array'],
			'item_rows.*.data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'item_rows.*.qty' => ['nullable', 'numeric', 'min:0.01'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['item_rows'] = collect($payload['item_rows'] ?? [])
			->map(fn (array $row) => [
				'data_menu_id' => (int) ($row['data_menu_id'] ?? 0),
				'qty' => (float) ($row['qty'] ?? 1),
			])
			->filter(fn (array $row) => $row['data_menu_id'] > 0)
			->values()
			->all();

		return $payload;
	}
}
