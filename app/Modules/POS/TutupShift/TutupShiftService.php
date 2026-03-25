<?php

namespace App\Modules\POS\TutupShift;

use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;

class TutupShiftService
{
	public function shiftSummary(BukaShiftEntity $shift): array
	{
		$baseQuery = PembayaranEntity::query()->where('shift_id', $shift->id);

		$cashTotal = (float) (clone $baseQuery)
			->where('metode_bayar', 'cash')
			->sum('nominal_tagihan');

		$nonCashTotal = (float) (clone $baseQuery)
			->where('metode_bayar', '!=', 'cash')
			->sum('nominal_tagihan');

		$totalTransaksi = (int) (clone $baseQuery)->count();
		$paidTotal = $cashTotal + $nonCashTotal;
		$expectedDrawer = (float) $shift->kas_awal + $cashTotal;

		return [
			'transaksi_total' => $totalTransaksi,
			'cash_total' => $cashTotal,
			'non_cash_total' => $nonCashTotal,
			'paid_total' => $paidTotal,
			'expected_drawer' => $expectedDrawer,
		];
	}

	public function activeShift(?int $userId = null): ?BukaShiftEntity
	{
		return BukaShiftEntity::query()
			->where('status', 'open')
			->when($userId, fn ($query) => $query->where('user_id', $userId))
			->latest('id')
			->first();
	}

	public function closeShift(BukaShiftEntity $shift, array $payload): TutupShiftEntity
	{
		$shiftRecord = TutupShiftEntity::fromShift($shift);
		$summary = $this->shiftSummary($shift);

		$kasAktual = (float) ($payload['kas_aktual'] ?? 0);
		$expected = (float) $summary['expected_drawer'];

		$shiftRecord->update([
			'status' => 'closed',
			'kas_aktual' => $kasAktual,
			'kas_sistem' => $expected,
			'selisih' => $kasAktual - $expected,
			'jumlah_transaksi' => (int) $summary['transaksi_total'],
			'catatan_tutup' => $payload['catatan_tutup'] ?? null,
			'waktu_tutup' => now(),
		]);

		return $shiftRecord->refresh();
	}
}
