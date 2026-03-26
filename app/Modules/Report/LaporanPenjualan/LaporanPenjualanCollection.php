<?php

namespace App\Modules\Report\LaporanPenjualan;

class LaporanPenjualanCollection
{
	public static function toDashboard(array $dashboard): array
	{
		return [
			'summary' => [
				'jumlah_transaksi' => (int) ($dashboard['summary']['jumlah_transaksi'] ?? 0),
				'omzet' => (float) ($dashboard['summary']['omzet'] ?? 0),
				'rata_rata_transaksi' => (float) ($dashboard['summary']['rata_rata_transaksi'] ?? 0),
				'nominal_dibayar' => (float) ($dashboard['summary']['nominal_dibayar'] ?? 0),
				'kembalian' => (float) ($dashboard['summary']['kembalian'] ?? 0),
			],
			'top_items' => collect($dashboard['top_items'] ?? [])->map(fn ($item) => [
				'nama_menu' => (string) ($item['nama_menu'] ?? '-'),
				'total_qty' => (int) ($item['total_qty'] ?? 0),
				'total_penjualan' => (float) ($item['total_penjualan'] ?? 0),
			])->values()->all(),
			'payment_methods' => collect($dashboard['payment_methods'] ?? [])->map(fn ($item) => [
				'kode' => (string) ($item['kode'] ?? ''),
				'nama' => (string) ($item['nama'] ?? '-'),
				'jumlah_transaksi' => (int) ($item['jumlah_transaksi'] ?? 0),
				'total_nominal' => (float) ($item['total_nominal'] ?? 0),
			])->values()->all(),
			'payroll_vs_revenue' => [
				'pendapatan' => (float) ($dashboard['payroll_vs_revenue']['pendapatan'] ?? 0),
				'penggajian' => (float) ($dashboard['payroll_vs_revenue']['penggajian'] ?? 0),
				'selisih' => (float) ($dashboard['payroll_vs_revenue']['selisih'] ?? 0),
				'rasio_persen' => (float) ($dashboard['payroll_vs_revenue']['rasio_persen'] ?? 0),
			],
			'daily_trend' => collect($dashboard['daily_trend'] ?? [])->map(fn ($item) => [
				'tanggal' => (string) ($item['tanggal'] ?? ''),
				'jumlah_transaksi' => (int) ($item['jumlah_transaksi'] ?? 0),
				'omzet' => (float) ($item['omzet'] ?? 0),
			])->values()->all(),
		];
	}
}
