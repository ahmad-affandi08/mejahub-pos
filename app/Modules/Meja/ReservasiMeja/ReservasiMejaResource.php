<?php

namespace App\Modules\Meja\ReservasiMeja;

use App\Http\Controllers\Controller;
use App\Modules\Meja\DataMeja\DataMejaEntity;
use App\Modules\Meja\ReservasiMeja\ReservasiMejaCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservasiMejaResource extends Controller
{
	public function __construct(private readonly ReservasiMejaService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Meja/ReservasiMeja/Index', [
			'reservasiMeja' => ReservasiMejaCollection::toIndex($paginator),
			'mejaOptions' => DataMejaEntity::query()
				->select(['id', 'nama', 'nomor_meja'])
				->orderBy('nama')
				->get()
				->map(fn (DataMejaEntity $item) => [
					'id' => $item->id,
					'nama' => trim($item->nama . ' ' . ($item->nomor_meja ? '(' . $item->nomor_meja . ')' : '')),
				]),
			'statusOptions' => [
				['value' => 'pending', 'label' => 'Pending'],
				['value' => 'confirmed', 'label' => 'Confirmed'],
				['value' => 'seated', 'label' => 'Seated'],
				['value' => 'cancelled', 'label' => 'Cancelled'],
				['value' => 'done', 'label' => 'Done'],
			],
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
			'data_meja_id' => ['required', 'integer', 'exists:data_meja,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:reservasi_meja,kode'],
			'nama_pelanggan' => ['required', 'string', 'max:120'],
			'no_hp' => ['nullable', 'string', 'max:30'],
			'waktu_reservasi' => ['required', 'date'],
			'jumlah_tamu' => ['required', 'integer', 'min:1'],
			'status' => ['required', 'string', 'in:pending,confirmed,seated,cancelled,done'],
			'catatan' => ['nullable', 'string'],
		]);

		$this->service->create($payload);

		return redirect()
			->route('meja.reservasi-meja.index')
			->with('success', 'Reservasi meja berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'data_meja_id' => ['required', 'integer', 'exists:data_meja,id'],
			'kode' => ['nullable', 'string', 'max:30', 'unique:reservasi_meja,kode,' . $id],
			'nama_pelanggan' => ['required', 'string', 'max:120'],
			'no_hp' => ['nullable', 'string', 'max:30'],
			'waktu_reservasi' => ['required', 'date'],
			'jumlah_tamu' => ['required', 'integer', 'min:1'],
			'status' => ['required', 'string', 'in:pending,confirmed,seated,cancelled,done'],
			'catatan' => ['nullable', 'string'],
		]);

		$this->service->update($id, $payload);

		return redirect()
			->route('meja.reservasi-meja.index')
			->with('success', 'Reservasi meja berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('meja.reservasi-meja.index')
			->with('success', 'Reservasi meja berhasil dihapus.');
	}
}
