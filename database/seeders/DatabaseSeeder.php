<?php

namespace Database\Seeders;

use Database\Seeders\SettingsSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UsersSeeder::class,
            HakAksesSeeder::class,
            DataPegawaiSeeder::class,
            PengaturanShiftSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}
