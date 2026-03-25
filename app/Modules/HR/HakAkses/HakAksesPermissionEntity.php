<?php

namespace App\Modules\HR\HakAkses;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HakAksesPermissionEntity extends Model
{
    protected $table = 'hak_akses_permission';

    protected $guarded = [];

    public function hakAkses(): BelongsTo
    {
        return $this->belongsTo(HakAksesEntity::class, 'hak_akses_id');
    }
}
