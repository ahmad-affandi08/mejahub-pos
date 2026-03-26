<?php

namespace App\Modules\Settings\ProfilToko;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProfilTokoEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'settings_profil_toko';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

