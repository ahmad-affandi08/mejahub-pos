<?php

namespace App\Modules\POS\TutupShift;

class TutupShiftCollection
{
	public static function toItem(TutupShiftEntity $shift): array
	{
		return [
			'id' => $shift->id,
			'kode' => $shift->kode,
			'status' => $shift->status,
			'kas_awal' => (float) $shift->kas_awal,
			'kas_aktual' => $shift->kas_aktual !== null ? (float) $shift->kas_aktual : null,
			'kas_sistem' => $shift->kas_sistem !== null ? (float) $shift->kas_sistem : null,
			'selisih' => $shift->selisih !== null ? (float) $shift->selisih : null,
			'jumlah_transaksi' => (int) $shift->jumlah_transaksi,
			'catatan_tutup' => $shift->catatan_tutup,
			'waktu_buka' => optional($shift->waktu_buka)?->toDateTimeString(),
			'waktu_tutup' => optional($shift->waktu_tutup)?->toDateTimeString(),
		];
	}
}
