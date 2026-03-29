<?php

namespace App\Modules\Inventory\PenerimaanBarang;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\PurchaseOrder\PurchaseOrderItemEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PenerimaanBarangItemEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_penerimaan_barang_item';

    protected $guarded = [];

    protected $casts = [
        'qty_diterima' => 'decimal:3',
        'qty_input' => 'decimal:3',
        'konversi_ke_kecil' => 'decimal:3',
        'harga_satuan' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function penerimaanBarang(): BelongsTo
    {
        return $this->belongsTo(PenerimaanBarangEntity::class, 'penerimaan_barang_id');
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItemEntity::class, 'purchase_order_item_id');
    }

    public function bahanBaku(): BelongsTo
    {
        return $this->belongsTo(BahanBakuEntity::class, 'bahan_baku_id');
    }
}
