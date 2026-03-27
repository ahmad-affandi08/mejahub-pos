<?php

namespace App\Modules\Dashboard\Overview;

class OverviewCollection
{
    public static function toDashboard(array $dashboard): array
    {
        return [
            'filters' => [
                'period_type' => (string) ($dashboard['filters']['period_type'] ?? 'daily'),
                'reference_date' => (string) ($dashboard['filters']['reference_date'] ?? now()->toDateString()),
                'date_from' => $dashboard['filters']['date_from'] ?? null,
                'date_to' => $dashboard['filters']['date_to'] ?? null,
                'top_limit' => (int) ($dashboard['filters']['top_limit'] ?? 10),
                'effective_range' => $dashboard['filters']['effective_range'] ?? null,
            ],
            'master_summary' => self::toSummary($dashboard['master_summary'] ?? []),
            'penjualan' => $dashboard['penjualan'] ?? [],
            'keuangan' => $dashboard['keuangan'] ?? [],
            'performa_menu' => $dashboard['performa_menu'] ?? [],
            'petty_cash' => $dashboard['petty_cash'] ?? [],
            'waste' => $dashboard['waste'] ?? [],
            'void_refund' => $dashboard['void_refund'] ?? [],
            'opname_selisih' => $dashboard['opname_selisih'] ?? [],
            'heatmap' => $dashboard['heatmap'] ?? [],
            'stok' => $dashboard['stok'] ?? [],
            'hutang' => $dashboard['hutang'] ?? [],
            'shift' => $dashboard['shift'] ?? [],
            'pajak' => $dashboard['pajak'] ?? [],
            'kpi_comparison' => $dashboard['kpi_comparison'] ?? [],
        ];
    }

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
