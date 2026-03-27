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
        'bahan_baku_id' => 'integer',
        'qty_bahan' => 'decimal:3',
        'approved_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function bahanBaku()
    {
        return $this->belongsTo(\App\Modules\Inventory\BahanBaku\BahanBakuEntity::class, 'bahan_baku_id');
    }
}

