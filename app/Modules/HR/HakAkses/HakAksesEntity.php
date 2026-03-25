<?php

namespace App\Modules\HR\HakAkses;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HakAksesEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'hak_akses';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function permissions(): HasMany
    {
        return $this->hasMany(HakAksesPermissionEntity::class, 'hak_akses_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_hak_akses', 'hak_akses_id', 'user_id')
            ->withTimestamps();
    }
}

