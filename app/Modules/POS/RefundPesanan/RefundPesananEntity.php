<?php

namespace App\Modules\POS\RefundPesanan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
}

