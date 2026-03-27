<?php

namespace App\Modules\Finance\Hutang;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PembayaranHutangEntity extends Model
{
    use SoftDeletes;

    protected $table = 'finance_pembayaran_hutang';

    protected $fillable = [
        'kode',
        'hutang_id',
        'tanggal_bayar',
        'nominal_bayar',
        'metode_pembayaran',
        'akun_kas_id',
        'referensi',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'tanggal_bayar' => 'date',
        'nominal_bayar' => 'decimal:2',
    ];

    /**
     * Get the hutang associated with this payment.
     */
    public function hutang()
    {
        return $this->belongsTo(HutangEntity::class, 'hutang_id', 'id');
    }
}
