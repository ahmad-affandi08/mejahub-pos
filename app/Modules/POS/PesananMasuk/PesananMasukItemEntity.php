<?php

namespace App\Modules\POS\PesananMasuk;

use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PesananMasukItemEntity extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'pos_pesanan_item';

    protected $guarded = [];

    protected $casts = [
        'harga_satuan' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'qty' => 'integer',
    ];

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(PesananMasukEntity::class, 'pesanan_id');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(DataMenuEntity::class, 'data_menu_id');
    }
}
