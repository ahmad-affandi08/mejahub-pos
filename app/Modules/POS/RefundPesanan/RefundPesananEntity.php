<?php

namespace App\Modules\POS\RefundPesanan;

use App\Models\User;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RefundPesananEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_refund_pesanan';

    protected $guarded = [];

    protected $casts = [
        'nominal' => 'decimal:2',
        'refunded_at' => 'datetime',
    ];

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(PesananMasukEntity::class, 'pesanan_id');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

