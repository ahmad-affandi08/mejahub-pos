<?php

namespace App\Modules\Inventory\BahanBaku;

use App\Modules\Inventory\Supplier\SupplierEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BahanBakuEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_bahan_baku';

    protected $guarded = [];

    protected $casts = [
        'harga_beli_terakhir' => 'decimal:2',
        'stok_minimum' => 'decimal:3',
        'stok_saat_ini' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierEntity::class, 'supplier_id');
    }
}

