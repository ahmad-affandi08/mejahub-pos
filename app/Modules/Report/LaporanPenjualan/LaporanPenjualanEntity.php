<?php

namespace App\Modules\Report\LaporanPenjualan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LaporanPenjualanEntity extends Model
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
}

