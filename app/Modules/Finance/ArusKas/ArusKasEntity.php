<?php

namespace App\Modules\Finance\ArusKas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ArusKasEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'finance_arus_kas';

    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'nominal' => 'decimal:2',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
    ];
}

