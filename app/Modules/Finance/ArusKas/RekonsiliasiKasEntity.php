<?php

namespace App\Modules\Finance\ArusKas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RekonsiliasiKasEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'finance_rekonsiliasi';

    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'saldo_sistem' => 'decimal:2',
        'saldo_aktual' => 'decimal:2',
        'selisih' => 'decimal:2',
    ];
}
