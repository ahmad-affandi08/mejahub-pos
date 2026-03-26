<?php

namespace App\Modules\Settings\KonfigurasiPajak;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KonfigurasiPajakEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'settings_konfigurasi_pajak';

    protected $guarded = [];

    protected $casts = [
        'nilai' => 'decimal:2',
        'is_inclusive' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'urutan' => 'integer',
    ];
}

