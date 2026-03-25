<?php

namespace App\Modules\Menu\KategoriMenu;

use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KategoriMenuEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'kategori_menu';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function dataMenu(): HasMany
    {
        return $this->hasMany(DataMenuEntity::class, 'kategori_menu_id');
    }
}

