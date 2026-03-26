<?php

namespace App\Modules\Finance\PettyCash;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PettyCashResource extends Controller
{
	public function __construct(private readonly PettyCashService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$status = trim((string) $request->query('status', ''));
		$perPage = (int) $request->query('per_page', 10);

		$paginator = $this->service->paginate($search, $perPage, $status);

		return Inertia::render('Finance/PettyCash/Index', [
			'pettyCash' => PettyCashCollection::toIndex($paginator),
			'summary' => $this->service->summary(),
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
			'kode' => ['nullable', 'string', 'max:40', 'unique:finance_petty_cash,kode'],
			'tanggal' => ['required', 'date'],
			'jenis_transaksi' => ['required', 'string', 'max:30'],
			'jenis_arus' => ['required', 'in:in,out'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'status_approval' => ['nullable', 'in:draft,submitted,approved,rejected'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->create($payload, auth()->id());

		return redirect()
			->route('finance.petty-cash.index')
			->with('success', 'Data petty cash berhasil ditambahkan.');
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
				->route('finance.petty-cash.index')
				->with('success', 'Status petty cash berhasil diperbarui.');
		}

		$payload = $request->validate([
			'tanggal' => ['required', 'date'],
			'jenis_transaksi' => ['required', 'string', 'max:30'],
			'jenis_arus' => ['required', 'in:in,out'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
			'action' => ['nullable', 'in:submit,approve,reject'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$this->service->update($id, $payload, auth()->id());

		return redirect()
			->route('finance.petty-cash.index')
			->with('success', 'Data petty cash berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('finance.petty-cash.index')
			->with('success', 'Data petty cash berhasil dihapus.');
	}
}
