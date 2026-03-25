<?php

namespace App\Modules\Dashboard\Overview;

use App\Models\User;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;

class OverviewService
{
    public function getSummary(): array
    {
        return [
            'total_user' => User::query()->count(),
            'total_pegawai' => DataPegawaiEntity::query()->count(),
            'total_kategori_menu' => KategoriMenuEntity::query()->count(),
            'total_data_menu' => DataMenuEntity::query()->count(),
        ];
    }
}
