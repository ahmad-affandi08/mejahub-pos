<?php

namespace App\Modules\Menu\PaketMenu;

use App\Modules\Menu\DataMenu\DataMenuEntity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaketMenuItemEntity extends Model
{
    use HasFactory;

    protected $table = 'paket_menu_item';

    protected $guarded = [];

    protected $casts = [
        'qty' => 'decimal:2',
    ];

    public function paketMenu(): BelongsTo
    {
        return $this->belongsTo(PaketMenuEntity::class, 'paket_menu_id');
    }

    public function dataMenu(): BelongsTo
    {
        return $this->belongsTo(DataMenuEntity::class, 'data_menu_id');
    }
}
