<?php

namespace App\Modules\Inventory\MutasiStok;

use App\Models\User;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MutasiStokEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_mutasi_stok';

    protected $guarded = [];

    protected $casts = [
        'qty' => 'decimal:3',
        'stok_sebelum' => 'decimal:3',
        'stok_sesudah' => 'decimal:3',
        'nilai_satuan' => 'decimal:2',
        'nilai_total' => 'decimal:2',
        'occurred_at' => 'datetime',
    ];

    public function bahanBaku(): BelongsTo
    {
        return $this->belongsTo(BahanBakuEntity::class, 'bahan_baku_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
