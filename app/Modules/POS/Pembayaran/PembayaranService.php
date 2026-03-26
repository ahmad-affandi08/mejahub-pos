<?php

namespace App\Modules\POS\Pembayaran;

use App\Modules\Inventory\ResepBOM\ResepBOMConsumptionService;
use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\PesananMasuk\PesananMasukCollection;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Support\PosDomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PembayaranService
{
	public function __construct(private readonly ResepBOMConsumptionService $resepBOMConsumptionService)
	{
	}

	public function receiptHistory(string $search = '', int $perPage = 20)
	{
		return PembayaranEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhereHas('pesanan', function ($orderQuery) use ($search) {
							$orderQuery
								->where('kode', 'like', '%' . $search . '%')
								->orWhere('nama_pelanggan', 'like', '%' . $search . '%');
						});
				});
			})
			->latest('id')
			->paginate(max(1, min($perPage, 100)));
	}

	public function recentPayments(int $limit = 20)
	{
		return PembayaranEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->latest('id')
			->limit($limit)
			->get();
	}

	public function pendingOrders(string $search = '')
	{
		return PesananMasukEntity::query()
			->with(['meja:id,nama', 'items'])
			->where('status', 'submitted')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('kode', 'like', '%' . $search . '%')
					->orWhere('nama_pelanggan', 'like', '%' . $search . '%');
			})
			->latest('id')
			->limit(50)
			->get();
	}

	public function activeShift(?int $userId = null): ?BukaShiftEntity
	{
		return BukaShiftEntity::query()
			->where('status', 'open')
			->when($userId, fn ($query) => $query->where('user_id', $userId))
			->latest('id')
			->first();
	}

	public function payOrder(array $payload, ?int $userId = null): PembayaranEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$order = PesananMasukEntity::query()
				->lockForUpdate()
				->findOrFail((int) $payload['pesanan_id']);

			if ($order->status !== 'submitted') {
				throw new PosDomainException('Pesanan tidak dalam status menunggu pembayaran.');
			}

			$nominalTagihan = (float) $order->total;
			$nominalDibayar = (float) $payload['nominal_dibayar'];

			if ($nominalDibayar < $nominalTagihan) {
				throw new PosDomainException('Nominal dibayar kurang dari total tagihan.');
			}

			$shift = $this->activeShift($userId);

			$payment = PembayaranEntity::query()->create([
				'pesanan_id' => $order->id,
				'shift_id' => $shift?->id,
				'user_id' => $userId,
				'kode' => $this->generateKode(),
				'metode_bayar' => $payload['metode_bayar'] ?? 'cash',
				'nominal_tagihan' => $nominalTagihan,
				'nominal_dibayar' => $nominalDibayar,
				'kembalian' => $nominalDibayar - $nominalTagihan,
				'status' => 'paid',
				'catatan' => $payload['catatan'] ?? null,
				'waktu_bayar' => now(),
			]);

			$order->update([
				'status' => 'paid',
				'waktu_bayar' => now(),
			]);

			$this->resepBOMConsumptionService->consumeForOrder($order->refresh()->load('items'), $userId);

			return $payment->refresh()->load('pesanan:id,kode');
		});
	}

	public function toOrderPayload($orders): array
	{
		return $orders
			->map(fn (PesananMasukEntity $item) => PesananMasukCollection::toItem($item))
			->values()
			->all();
	}

	private function generateKode(): string
	{
		return 'PAY-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}
}
