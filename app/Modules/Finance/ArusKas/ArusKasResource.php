<?php

namespace App\Modules\Finance\ArusKas;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArusKasResource extends Controller
{
	public function __construct(private readonly ArusKasService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);
		$dateFrom = $request->query('date_from');
		$dateTo = $request->query('date_to');
		$jenisAkun = trim((string) $request->query('jenis_akun', ''));

		$this->service->syncSystemJournals();

		$entries = $this->service->paginate(
			$search,
			$perPage,
			is_string($dateFrom) ? $dateFrom : null,
			is_string($dateTo) ? $dateTo : null,
			$jenisAkun,
		);

		$rekonsiliasi = $this->service->rekonsiliasiPaginate(8, $jenisAkun);

		return Inertia::render('Finance/ArusKas/Index', [
			'entries' => ArusKasCollection::toIndex($entries),
			'rekonsiliasi' => ArusKasCollection::toRekonsiliasi($rekonsiliasi),
			'summary' => $this->service->summary(
				is_string($dateFrom) ? $dateFrom : null,
				is_string($dateTo) ? $dateTo : null,
			),
			'filters' => [
				'search' => $search,
				'per_page' => $perPage,
				'date_from' => is_string($dateFrom) ? $dateFrom : '',
				'date_to' => is_string($dateTo) ? $dateTo : '',
				'jenis_akun' => $jenisAkun,
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse
	{
		$entryType = (string) $request->input('entry_type', 'manual');

		if ($entryType === 'rekonsiliasi') {
			$payload = $request->validate([
				'entry_type' => ['required', 'in:rekonsiliasi'],
				'tanggal' => ['required', 'date'],
				'jenis_akun' => ['required', 'in:kas,bank'],
				'saldo_aktual' => ['required', 'numeric'],
				'catatan' => ['nullable', 'string'],
			]);

			$this->service->createRekonsiliasi($payload, auth()->id());

			return redirect()
				->route('finance.arus-kas.index')
				->with('success', 'Rekonsiliasi kas/bank berhasil disimpan.');
		}

		$payload = $request->validate([
			'entry_type' => ['nullable', 'in:manual'],
			'tanggal' => ['required', 'date'],
			'jenis_akun' => ['required', 'in:kas,bank'],
			'jenis_arus' => ['required', 'in:in,out'],
			'referensi_kode' => ['nullable', 'string', 'max:80'],
			'kategori' => ['nullable', 'string', 'max:80'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'status' => ['nullable', 'in:draft,posted'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->createManual($payload, auth()->id());

		return redirect()
			->route('finance.arus-kas.index')
			->with('success', 'Jurnal arus kas manual berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'tanggal' => ['required', 'date'],
			'jenis_akun' => ['required', 'in:kas,bank'],
			'jenis_arus' => ['required', 'in:in,out'],
			'referensi_kode' => ['nullable', 'string', 'max:80'],
			'kategori' => ['nullable', 'string', 'max:80'],
			'deskripsi' => ['required', 'string', 'max:255'],
			'nominal' => ['required', 'numeric', 'min:0'],
			'status' => ['nullable', 'in:draft,posted'],
			'catatan' => ['nullable', 'string'],
			'is_active' => ['nullable', 'boolean'],
		]);

		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);

		$this->service->updateManual($id, $payload);

		return redirect()
			->route('finance.arus-kas.index')
			->with('success', 'Jurnal arus kas berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->deleteManual($id);

		return redirect()
			->route('finance.arus-kas.index')
			->with('success', 'Jurnal arus kas berhasil dihapus.');
	}
}
