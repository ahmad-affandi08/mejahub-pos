<?php

namespace App\Modules\HR\PengaturanGaji;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PengaturanGajiEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pengaturan_gaji_pegawai';

    protected $guarded = [];

    protected $casts = [
        'gaji_pokok' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }
}
