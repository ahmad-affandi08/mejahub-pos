<?php

namespace App\Modules\HR\PengaturanShift;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PengaturanShiftEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pengaturan_shift';

    protected $guarded = [];

    protected $casts = [
        'lintas_hari' => 'boolean',
        'require_face_verification' => 'boolean',
        'require_location_validation' => 'boolean',
        'is_active' => 'boolean',
    ];
}
