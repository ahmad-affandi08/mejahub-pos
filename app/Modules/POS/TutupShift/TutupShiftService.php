<?php

namespace App\Modules\POS\TutupShift;

use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;

class TutupShiftService
{
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

		$kasSistem = (float) PembayaranEntity::query()
			->where('shift_id', $shift->id)
			->sum('nominal_dibayar');

		$kasAwal = (float) $shiftRecord->kas_awal;
		$kasAktual = (float) ($payload['kas_aktual'] ?? 0);
		$expected = $kasAwal + $kasSistem;

		$shiftRecord->update([
			'status' => 'closed',
			'kas_aktual' => $kasAktual,
			'kas_sistem' => $expected,
			'selisih' => $kasAktual - $expected,
			'jumlah_transaksi' => (int) PembayaranEntity::query()->where('shift_id', $shift->id)->count(),
			'catatan_tutup' => $payload['catatan_tutup'] ?? null,
			'waktu_tutup' => now(),
		]);

		return $shiftRecord->refresh();
	}
}
