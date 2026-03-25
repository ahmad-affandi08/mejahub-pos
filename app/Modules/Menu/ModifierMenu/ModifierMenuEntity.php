<?php

namespace App\Modules\Menu\ModifierMenu;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModifierMenuEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'modifier_menu';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

