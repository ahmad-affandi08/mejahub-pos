<?php

namespace App\Modules\POS\VoidPesanan;

use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VoidPesananService
{
	public function eligibleOrders(string $search = ''): Collection
	{
		return PesananMasukEntity::query()
			->with(['meja:id,nama'])
			->whereIn('status', ['draft', 'submitted'])
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
		return VoidPesananEntity::query()
			->latest('id')
			->limit(20)
			->get();
	}

	public function voidOrder(int $pesananId, string $alasan, ?int $userId = null): VoidPesananEntity
	{
		return DB::transaction(function () use ($pesananId, $alasan, $userId) {
			$order = PesananMasukEntity::query()->findOrFail($pesananId);

			if ($order->status === 'paid') {
				abort(422, 'Pesanan sudah dibayar. Gunakan proses refund.');
			}

			if ($order->status === 'void' || $order->status === 'voided') {
				abort(422, 'Pesanan sudah di-void sebelumnya.');
			}

			$log = VoidPesananEntity::query()->create([
				'pesanan_id' => $order->id,
				'user_id' => $userId,
				'kode' => $this->generateKode(),
				'alasan' => $alasan,
				'status' => 'voided',
				'voided_at' => now(),
			]);

			$order->update([
				'status' => 'void',
				'catatan' => trim((string) ($order->catatan . ' | Void: ' . $alasan)),
			]);

			return $log;
		});
	}

	private function generateKode(): string
	{
		return 'VOID-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}
}
