<?php

namespace App\Modules\POS\BukaShift;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BukaShiftEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_shift';

    protected $guarded = [];

    protected $casts = [
        'kas_awal' => 'decimal:2',
        'kas_aktual' => 'decimal:2',
        'kas_sistem' => 'decimal:2',
        'selisih' => 'decimal:2',
        'jumlah_transaksi' => 'integer',
        'waktu_buka' => 'datetime',
        'waktu_tutup' => 'datetime',
    ];

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

