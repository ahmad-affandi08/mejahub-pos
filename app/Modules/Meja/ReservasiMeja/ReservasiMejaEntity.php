<?php

namespace App\Modules\Meja\ReservasiMeja;

use App\Modules\Meja\DataMeja\DataMejaEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReservasiMejaEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'reservasi_meja';

    protected $guarded = [];

    protected $casts = [
        'waktu_reservasi' => 'datetime',
        'jumlah_tamu' => 'integer',
    ];

    public function meja(): BelongsTo
    {
        return $this->belongsTo(DataMejaEntity::class, 'data_meja_id');
    }
}

