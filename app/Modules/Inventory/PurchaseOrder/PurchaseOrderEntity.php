<?php

namespace App\Modules\Inventory\PurchaseOrder;

use App\Models\User;
use App\Modules\Inventory\Supplier\SupplierEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrderEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_purchase_order';

    protected $guarded = [];

    protected $casts = [
        'tanggal_po' => 'date',
        'total' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierEntity::class, 'supplier_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItemEntity::class, 'purchase_order_id');
    }
}

