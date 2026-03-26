<?php

namespace App\Modules\Settings\MetodePembayaran;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MetodePembayaranEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'settings_metode_pembayaran';

    protected $guarded = [];

    protected $casts = [
        'biaya_persen' => 'decimal:2',
        'biaya_flat' => 'decimal:2',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'requires_reference' => 'boolean',
        'urutan' => 'integer',
    ];
}

