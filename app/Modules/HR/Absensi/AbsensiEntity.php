<?php

namespace App\Modules\HR\Absensi;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbsensiEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'absensi';

    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }
}

