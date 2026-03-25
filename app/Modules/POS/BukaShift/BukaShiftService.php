<?php

namespace App\Modules\POS\BukaShift;

use Illuminate\Support\Str;

class BukaShiftService
{
	public function activeShift(?int $userId = null): ?BukaShiftEntity
	{
		return BukaShiftEntity::query()
			->with('kasir:id,name')
			->where('status', 'open')
			->when($userId, fn ($query) => $query->where('user_id', $userId))
			->latest('id')
			->first();
	}

	public function recentShifts(int $limit = 10)
	{
		return BukaShiftEntity::query()
			->with('kasir:id,name')
			->latest('id')
			->limit($limit)
			->get();
	}

	public function openShift(array $payload, ?int $userId = null): BukaShiftEntity
	{
		return BukaShiftEntity::query()->create([
			'user_id' => $userId,
			'kode' => $this->generateKode(),
			'status' => 'open',
			'kas_awal' => (float) ($payload['kas_awal'] ?? 0),
			'catatan_buka' => $payload['catatan_buka'] ?? null,
			'waktu_buka' => now(),
		]);
	}

	private function generateKode(): string
	{
		return 'SFT-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}
}
