<?php

namespace App\Modules\Menu\DataMenu;

use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Menu\PaketMenu\PaketMenuItemEntity;
use App\Modules\Menu\VarianMenu\VarianMenuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DataMenuEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'data_menu';

    protected $guarded = [];

    protected $casts = [
        'harga' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(KategoriMenuEntity::class, 'kategori_menu_id');
    }

    public function varianMenu(): HasMany
    {
        return $this->hasMany(VarianMenuEntity::class, 'data_menu_id');
    }

    public function paketItems(): HasMany
    {
        return $this->hasMany(PaketMenuItemEntity::class, 'data_menu_id');
    }
}

