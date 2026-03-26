<?php

namespace App\Modules\Inventory\OpnameStok;

use App\Models\User;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OpnameStokEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_opname_stok';

    protected $guarded = [];

    protected $casts = [
        'tanggal_opname' => 'date',
        'stok_sistem' => 'decimal:3',
        'stok_fisik' => 'decimal:3',
        'selisih' => 'decimal:3',
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

