<?php

namespace App\Modules\POS\SplitBill;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SplitBillEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_split_bill';

    protected $guarded = [];

    protected $casts = [
        'split_at' => 'datetime',
    ];
}

