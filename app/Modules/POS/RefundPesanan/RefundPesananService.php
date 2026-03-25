<?php

namespace App\Modules\POS\RefundPesanan;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RefundPesananService
{
	public function paidOrders(string $search = ''): Collection
	{
		return PesananMasukEntity::query()
			->with('meja:id,nama')
			->where('status', 'paid')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('kode', 'like', '%' . $search . '%')
					->orWhere('nama_pelanggan', 'like', '%' . $search . '%');
			})
			->latest('id')
			->limit(80)
			->get();
	}

	public function recentLogs(): Collection
	{
		return RefundPesananEntity::query()
			->latest('id')
			->limit(20)
			->get();
	}

	public function refundOrder(int $pesananId, float $nominal, string $metode, string $alasan, ?int $userId = null): RefundPesananEntity
	{
		return DB::transaction(function () use ($pesananId, $nominal, $metode, $alasan, $userId) {
			$order = PesananMasukEntity::query()->findOrFail($pesananId);

			if ($order->status !== 'paid') {
				abort(422, 'Hanya pesanan dengan status paid yang bisa direfund.');
			}

			$orderTotal = (float) $order->total;
			$refundNominal = $nominal > 0 ? $nominal : $orderTotal;

			if ($refundNominal > $orderTotal) {
				abort(422, 'Nominal refund melebihi total pesanan.');
			}

			$log = RefundPesananEntity::query()->create([
				'pesanan_id' => $order->id,
				'user_id' => $userId,
				'kode' => $this->generateKode(),
				'nominal' => $refundNominal,
				'metode' => $metode,
				'alasan' => $alasan,
				'status' => 'processed',
				'refunded_at' => now(),
			]);

			$order->update([
				'status' => $refundNominal >= $orderTotal ? 'refunded' : 'paid',
				'catatan' => trim((string) ($order->catatan . ' | Refund ' . $refundNominal . ': ' . $alasan)),
			]);

			return $log;
		});
	}

	private function generateKode(): string
	{
		return 'REF-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}
}
