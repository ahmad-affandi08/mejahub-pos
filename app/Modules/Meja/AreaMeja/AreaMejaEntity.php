<?php

namespace App\Modules\Meja\AreaMeja;

use App\Modules\Meja\DataMeja\DataMejaEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AreaMejaEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'area_meja';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function dataMeja(): HasMany
    {
        return $this->hasMany(DataMejaEntity::class, 'area_meja_id');
    }
}

