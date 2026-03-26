<?php

namespace App\Modules\Inventory\PurchaseOrder;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrderItemEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_purchase_order_item';

    protected $guarded = [];

    protected $casts = [
        'qty_pesan' => 'decimal:3',
        'qty_diterima' => 'decimal:3',
        'harga_satuan' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderEntity::class, 'purchase_order_id');
    }

    public function bahanBaku(): BelongsTo
    {
        return $this->belongsTo(BahanBakuEntity::class, 'bahan_baku_id');
    }
}
