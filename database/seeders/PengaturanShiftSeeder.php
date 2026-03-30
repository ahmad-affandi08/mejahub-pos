<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PengaturanShiftSeeder extends Seeder
{
	use WithoutModelEvents;

	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		$now = now();

		$rows = [
			[
				'kode' => 'P1',
				'nama' => 'Pagi',
				'jam_masuk' => '08:00:00',
				'jam_keluar' => '15:00:00',
			],
			[
				'kode' => 'M1',
				'nama' => 'Middle',
				'jam_masuk' => '12:00:00',
				'jam_keluar' => '20:00:00',
			],
			[
				'kode' => 'S1',
				'nama' => 'Sore',
				'jam_masuk' => '15:00:00',
				'jam_keluar' => '23:00:00',
			],
		];

		foreach ($rows as $item) {
			DB::table('pengaturan_shift')->updateOrInsert(
				['kode' => $item['kode']],
				[
					'nama' => $item['nama'],
					'jam_masuk' => $item['jam_masuk'],
					'jam_keluar' => $item['jam_keluar'],
					'toleransi_telat_menit' => 15,
					'toleransi_pulang_cepat_menit' => 15,
					'lintas_hari' => false,
					'is_active' => true,
					'updated_at' => $now,
					'created_at' => $now,
				]
			);
		}
	}
}
