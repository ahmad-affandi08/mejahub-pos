<?php

namespace App\Modules\HR\Penggajian;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PenggajianEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'penggajian';

    protected $guarded = [];

    protected $casts = [
        'tanggal_pembayaran' => 'date',
        'gaji_pokok' => 'decimal:2',
        'tunjangan' => 'decimal:2',
        'lembur' => 'decimal:2',
        'bonus' => 'decimal:2',
        'potongan' => 'decimal:2',
        'total_gaji' => 'decimal:2',
        'jumlah_hadir' => 'integer',
        'jumlah_izin' => 'integer',
        'jumlah_sakit' => 'integer',
        'jumlah_cuti' => 'integer',
        'jumlah_alpha' => 'integer',
        'jumlah_terlambat' => 'integer',
        'generated_from_absensi' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
    }
}
