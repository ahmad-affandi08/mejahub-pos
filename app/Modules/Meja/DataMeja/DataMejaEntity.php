<?php

namespace App\Modules\Meja\DataMeja;

use App\Modules\Meja\AreaMeja\AreaMejaEntity;
use App\Modules\Meja\ReservasiMeja\ReservasiMejaEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DataMejaEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'data_meja';

    protected $guarded = [];

    protected $casts = [
        'kapasitas' => 'integer',
        'is_active' => 'boolean',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(AreaMejaEntity::class, 'area_meja_id');
    }

    public function reservasi(): HasMany
    {
        return $this->hasMany(ReservasiMejaEntity::class, 'data_meja_id');
    }
}

