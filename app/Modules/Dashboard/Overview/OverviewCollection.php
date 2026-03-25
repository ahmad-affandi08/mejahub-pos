<?php

namespace App\Modules\Dashboard\Overview;

class OverviewCollection
{
    public static function toSummary(array $summary): array
    {
        return [
            'total_user' => (int) ($summary['total_user'] ?? 0),
            'total_pegawai' => (int) ($summary['total_pegawai'] ?? 0),
            'total_kategori_menu' => (int) ($summary['total_kategori_menu'] ?? 0),
            'total_data_menu' => (int) ($summary['total_data_menu'] ?? 0),
        ];
    }
}
