<?php

namespace App\Modules\POS\Pembayaran;

use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\PesananMasuk\PesananMasukCollection;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Str;

class PembayaranService
{
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
		$order = PesananMasukEntity::query()->findOrFail((int) $payload['pesanan_id']);

		if ($order->status !== 'submitted') {
			abort(422, 'Pesanan tidak dalam status menunggu pembayaran.');
		}

		$nominalTagihan = (float) $order->total;
		$nominalDibayar = (float) $payload['nominal_dibayar'];

		if ($nominalDibayar < $nominalTagihan) {
			abort(422, 'Nominal dibayar kurang dari total tagihan.');
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

		return $payment->refresh()->load('pesanan:id,kode');
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
