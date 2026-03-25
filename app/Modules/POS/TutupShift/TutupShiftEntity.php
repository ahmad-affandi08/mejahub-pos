<?php

namespace App\Modules\POS\TutupShift;

use App\Modules\POS\BukaShift\BukaShiftEntity;
use Illuminate\Database\Eloquent\Model;

class TutupShiftEntity extends Model
{
    protected $guarded = [];
    protected $table = 'pos_shift';

    protected $casts = [
        'kas_awal' => 'decimal:2',
        'kas_aktual' => 'decimal:2',
        'kas_sistem' => 'decimal:2',
        'selisih' => 'decimal:2',
        'jumlah_transaksi' => 'integer',
        'waktu_buka' => 'datetime',
        'waktu_tutup' => 'datetime',
    ];

    public static function fromShift(BukaShiftEntity $shift): self
    {
        return self::query()->findOrFail($shift->id);
    }
}

