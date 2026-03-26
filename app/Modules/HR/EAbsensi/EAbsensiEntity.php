<?php

namespace App\Modules\HR\EAbsensi;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\JadwalShift\JadwalShiftEntity;
use App\Modules\HR\PengaturanShift\PengaturanShiftEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EAbsensiEntity extends Model
{
	use HasFactory;
	use SoftDeletes;

	protected $table = 'absensi';

	protected $guarded = [];

	protected $casts = [
		'tanggal' => 'date',
		'is_active' => 'boolean',
		'dalam_radius' => 'boolean',
		'skor_wajah' => 'decimal:2',
	];

	public function pegawai(): BelongsTo
	{
		return $this->belongsTo(DataPegawaiEntity::class, 'pegawai_id');
	}

	public function shift(): BelongsTo
	{
		return $this->belongsTo(PengaturanShiftEntity::class, 'shift_id');
	}

	public function jadwalShift(): BelongsTo
	{
		return $this->belongsTo(JadwalShiftEntity::class, 'jadwal_shift_id');
	}
}
