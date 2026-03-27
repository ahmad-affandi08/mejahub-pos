<?php

namespace App\Modules\Inventory\PenerimaanBarang;

use App\Models\User;
use App\Modules\Inventory\PurchaseOrder\PurchaseOrderEntity;
use App\Modules\Inventory\Supplier\SupplierEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PenerimaanBarangEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_penerimaan_barang';

    protected $guarded = [];

    protected $casts = [
        'tanggal_terima' => 'date',
        'jatuh_tempo' => 'date',
        'total' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderEntity::class, 'purchase_order_id');
    }

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
        return $this->hasMany(PenerimaanBarangItemEntity::class, 'penerimaan_barang_id');
    }

    public function hutang()
    {
        return $this->hasOne(\App\Modules\Finance\Hutang\HutangEntity::class, 'sumber_id')->where('sumber_tipe', 'penerimaan_barang');
    }
}
