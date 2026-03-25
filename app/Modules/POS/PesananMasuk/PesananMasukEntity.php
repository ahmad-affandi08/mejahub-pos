<?php

namespace App\Modules\POS\PesananMasuk;

use App\Models\User;
use App\Modules\Meja\DataMeja\DataMejaEntity;
use App\Modules\POS\PesananMasuk\PesananMasukItemEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PesananMasukEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_pesanan';

    protected $guarded = [];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'diskon' => 'decimal:2',
        'pajak' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total' => 'decimal:2',
        'waktu_pesan' => 'datetime',
        'waktu_bayar' => 'datetime',
    ];

    public function meja(): BelongsTo
    {
        return $this->belongsTo(DataMejaEntity::class, 'data_meja_id');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PesananMasukItemEntity::class, 'pesanan_id');
    }
}

