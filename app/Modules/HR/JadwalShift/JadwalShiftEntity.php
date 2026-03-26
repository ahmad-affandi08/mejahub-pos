<?php

namespace App\Modules\HR\JadwalShift;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanShift\PengaturanShiftEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JadwalShiftEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'jadwal_shift';

    protected $guarded = [];

    protected $casts = [
        'tanggal' => 'date',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(PengaturanShiftEntity::class, 'shift_id');
    }
}
