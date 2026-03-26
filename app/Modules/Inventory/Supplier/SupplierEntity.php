<?php

namespace App\Modules\Inventory\Supplier;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_supplier';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function bahanBaku(): HasMany
    {
        return $this->hasMany(BahanBakuEntity::class, 'supplier_id');
    }
}

