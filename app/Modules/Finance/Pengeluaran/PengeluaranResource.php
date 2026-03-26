<?php

namespace App\Modules\Finance\Pengeluaran;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengeluaranResource extends Controller
{
	public function __construct(private readonly PengeluaranService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$status = trim((string) $request->query('status', ''));
		$perPage = (int) $request->query('per_page', 10);

		$paginator = $this->service->paginate($search, $perPage, $status);

		return Inertia::render('Finance/Pengeluaran/Index', [
			'pengeluaran' => PengeluaranCollection::toIndex($paginator),
			'summary' => $this->service->summary(),
			'categoryOptions' => PengeluaranService::CATEGORY_OPTIONS,
			'filters' => [
				'search' => $search,
				'status' => $status,
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:finance_pengeluaran,kode'],
			'tanggal' => ['required', 'date'],
			'kategori_biaya' => ['required', 'string', 'max:80'],
			'metode_pembayaran' => ['required', 'in:kas,bank'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'status_approval' => ['nullable', 'in:draft,submitted,approved,rejected'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'vendor_nama' => ['nullable', 'string', 'max:120'],
			'nomor_bukti' => ['nullable', 'string', 'max:80'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->create($payload, auth()->id());

		return redirect()
			->route('finance.pengeluaran.index')
			->with('success', 'Data pengeluaran berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		if ($request->boolean('quick_action')) {
			$payload = $request->validate([
				'quick_action' => ['required', 'boolean'],
				'action' => ['required', 'in:submit,approve,reject'],
			]);

			if ($payload['action'] === 'submit') {
				$this->service->submit($id);
			}

			if ($payload['action'] === 'approve') {
				$this->service->approve($id, auth()->id());
			}

			if ($payload['action'] === 'reject') {
				$this->service->reject($id, auth()->id());
			}

			return redirect()
				->route('finance.pengeluaran.index')
				->with('success', 'Status pengeluaran berhasil diperbarui.');
		}

		$payload = $request->validate([
			'tanggal' => ['required', 'date'],
			'kategori_biaya' => ['required', 'string', 'max:80'],
			'metode_pembayaran' => ['required', 'in:kas,bank'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'vendor_nama' => ['nullable', 'string', 'max:120'],
			'nomor_bukti' => ['nullable', 'string', 'max:80'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
			'action' => ['nullable', 'in:submit,approve,reject'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->update($id, $payload, auth()->id());

		return redirect()
			->route('finance.pengeluaran.index')
			->with('success', 'Data pengeluaran berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('finance.pengeluaran.index')
			->with('success', 'Data pengeluaran berhasil dihapus.');
	}
}
