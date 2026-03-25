<?php

namespace App\Modules\POS\VoidPesanan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VoidPesananEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_void_pesanan';

    protected $guarded = [];

    protected $casts = [
        'voided_at' => 'datetime',
    ];
}

