<?php

namespace App\Modules\Finance\Hutang;

use App\Modules\Inventory\Supplier\SupplierEntity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HutangEntity extends Model
{
    use SoftDeletes;

    protected $table = 'finance_hutang';

    protected $fillable = [
        'kode',
        'supplier_id',
        'sumber_tipe',
        'sumber_id',
        'tanggal_hutang',
        'jatuh_tempo',
        'nominal_hutang',
        'sisa_hutang',
        'status',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'tanggal_hutang' => 'date',
        'jatuh_tempo' => 'date',
        'nominal_hutang' => 'decimal:2',
        'sisa_hutang' => 'decimal:2',
    ];

    /**
     * Get the supplier associated with this hutang.
     */
    public function supplier()
    {
        return $this->belongsTo(SupplierEntity::class, 'supplier_id', 'id');
    }

    /**
     * Get the payments related to this hutang.
     */
    public function pembayaran()
    {
        return $this->hasMany(PembayaranHutangEntity::class, 'hutang_id', 'id');
    }
}
