<?php

namespace App\Modules\HR\DataPegawai;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DataPegawaiEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'data_pegawai';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'pola_shift' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

