<?php

namespace App\Modules\Inventory\ManajemenWaste;

use App\Models\User;
use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManajemenWasteEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_manajemen_waste';

    protected $guarded = [];

    protected $casts = [
        'tanggal_waste' => 'date',
        'stok_sebelum' => 'decimal:3',
        'qty_waste' => 'decimal:3',
        'stok_setelah' => 'decimal:3',
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

