<?php

namespace App\Modules\Menu\PaketMenu;

use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Menu\PaketMenu\PaketMenuItemEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaketMenuEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'paket_menu';

    protected $guarded = [];

    protected $casts = [
        'harga_paket' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(KategoriMenuEntity::class, 'kategori_menu_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PaketMenuItemEntity::class, 'paket_menu_id');
    }
}

