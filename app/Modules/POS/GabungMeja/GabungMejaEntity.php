<?php

namespace App\Modules\POS\GabungMeja;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GabungMejaEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_gabung_meja';

    protected $guarded = [];

    protected $casts = [
        'merged_at' => 'datetime',
    ];
}

