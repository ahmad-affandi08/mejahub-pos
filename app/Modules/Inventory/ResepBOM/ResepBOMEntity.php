<?php

namespace App\Modules\Inventory\ResepBOM;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResepBOMEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'inventory_resep_bom';

    protected $guarded = [];

    protected $casts = [
        'qty_kebutuhan' => 'decimal:3',
        'referensi_porsi' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(DataMenuEntity::class, 'data_menu_id');
    }

    public function bahanBaku(): BelongsTo
    {
        return $this->belongsTo(BahanBakuEntity::class, 'bahan_baku_id');
    }
}

