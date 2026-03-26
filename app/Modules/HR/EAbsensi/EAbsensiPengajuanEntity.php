<?php

namespace App\Modules\HR\EAbsensi;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\JadwalShift\JadwalShiftEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EAbsensiPengajuanEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'absensi_pengajuan';

    protected $guarded = [];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }

    public function pegawaiTujuan(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_tujuan_id');
    }

    public function jadwalShift(): BelongsTo
    {
        return $this->belongsTo(JadwalShiftEntity::class, 'jadwal_shift_id');
    }

    public function jadwalShiftTujuan(): BelongsTo
    {
        return $this->belongsTo(JadwalShiftEntity::class, 'jadwal_shift_tujuan_id');
    }
}
