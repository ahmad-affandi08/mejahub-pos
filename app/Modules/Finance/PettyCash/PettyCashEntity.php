<?php

namespace App\Modules\Finance\PettyCash;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'finance_petty_cash';

    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'nominal' => 'decimal:2',
        'saldo_setelah' => 'decimal:2',
        'approved_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}

