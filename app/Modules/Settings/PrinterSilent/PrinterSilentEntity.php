<?php

namespace App\Modules\Settings\PrinterSilent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PrinterSilentEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'settings_printer_silent';

    protected $guarded = [];

    protected $casts = [
        'port' => 'integer',
        'copies' => 'integer',
        'auto_print_order' => 'boolean',
        'auto_print_payment' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];
}

