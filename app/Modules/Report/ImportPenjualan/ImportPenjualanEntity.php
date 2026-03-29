<?php

namespace App\Modules\Report\ImportPenjualan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ImportPenjualanEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'report_import_penjualan';

    protected $guarded = [];

    protected $casts = [
        'waktu_order' => 'datetime',
        'waktu_bayar' => 'datetime',
        'tanggal_transaksi' => 'date',
        'sisa_tagihan' => 'decimal:2',
        'total_penjualan' => 'decimal:2',
        'raw_row' => 'array',
        'is_active' => 'boolean',
        'synced_at' => 'datetime',
    ];
}
