<?php

namespace App\Modules\POS\Pembayaran;

use App\Models\User;
use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PembayaranEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_pembayaran';

    protected $guarded = [];

    protected $casts = [
        'nominal_tagihan' => 'decimal:2',
        'nominal_dibayar' => 'decimal:2',
        'kembalian' => 'decimal:2',
        'payment_details' => 'array',
        'waktu_bayar' => 'datetime',
    ];

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(PesananMasukEntity::class, 'pesanan_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(BukaShiftEntity::class, 'shift_id');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

