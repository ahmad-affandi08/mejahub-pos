<?php

namespace App\Modules\POS\PesananMasuk;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PesananMasukResource extends Controller
{
	public function __construct(private readonly PesananMasukService $service)
	{
	}

	public function index(Request $request): Response|JsonResponse
	{
		$search = trim((string) $request->query('search', ''));
		$payload = $this->service->getReferenceData($search);

		if ($request->expectsJson()) {
			return response()->json([
				'data' => $payload,
				'filters' => ['search' => $search],
			]);
		}

		return Inertia::render('POS/PesananMasuk/Index', [
			'menus' => $payload['menus'],
			'meja' => $payload['meja'],
			'orders' => $payload['orders'],
			'filters' => ['search' => $search],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'data_meja_id' => ['nullable', 'integer', 'exists:data_meja,id'],
			'nama_pelanggan' => ['nullable', 'string', 'max:120'],
			'status' => ['nullable', 'string', 'in:draft,submitted,paid,void'],
			'diskon' => ['nullable', 'numeric', 'min:0'],
			'pajak' => ['nullable', 'numeric', 'min:0'],
			'service_charge' => ['nullable', 'numeric', 'min:0'],
			'catatan' => ['nullable', 'string'],
			'items' => ['required', 'array', 'min:1'],
			'items.*.data_menu_id' => ['required', 'integer', 'exists:data_menu,id'],
			'items.*.qty' => ['required', 'integer', 'min:1'],
			'items.*.catatan' => ['nullable', 'string'],
		]);

		$order = $this->service->createOrder($payload, auth()->id());

		if ($request->expectsJson()) {
			return response()->json([
				'message' => 'Pesanan berhasil dibuat.',
				'data' => PesananMasukCollection::toItem($order),
			], 201);
		}

		return redirect()
			->route('pos.pesanan-masuk.index')
			->with('success', 'Pesanan berhasil dibuat.');
	}

	public function update(Request $request, int $id): RedirectResponse|JsonResponse
	{
		$payload = $request->validate([
			'status' => ['required', 'string', 'in:draft,submitted,paid,void'],
		]);

		$order = $this->service->updateStatus($id, $payload['status']);

		if ($request->expectsJson()) {
			return response()->json([
				'message' => 'Status pesanan diperbarui.',
				'data' => PesananMasukCollection::toItem($order),
			]);
		}

		return redirect()
			->route('pos.pesanan-masuk.index')
			->with('success', 'Status pesanan berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse|JsonResponse
	{
		$order = PesananMasukEntity::query()->findOrFail($id);
		$order->delete();

		if (request()->expectsJson()) {
			return response()->json([
				'message' => 'Pesanan dihapus.',
			]);
		}

		return redirect()
			->route('pos.pesanan-masuk.index')
			->with('success', 'Pesanan berhasil dihapus.');
	}
}
