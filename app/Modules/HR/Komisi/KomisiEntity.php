<?php

namespace App\Modules\HR\Komisi;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class KomisiEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'komisi';

    protected $guarded = [];

    protected $casts = [
        'dasar_perhitungan' => 'decimal:2',
        'persentase' => 'decimal:2',
        'nominal' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }
}

