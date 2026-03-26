<?php

namespace Database\Seeders;

use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KategoriMenuSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoriList = [
            'SOFT DRINK',
            'COFFEE',
            'Maincourse',
            'WESTERN',
            'Paket Ramadhan',
            'Non Coffee',
            'SNACK',
            'PASTRY',
            'PASTA',
            'TEA',
            'MOCKTAIL COFFE',
            'RICEBOWL',
        ];

        foreach ($kategoriList as $index => $kategori) {
            KategoriMenuEntity::query()->updateOrCreate(
                ['nama' => $kategori],
                [
                    'kode' => 'KM-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'is_active' => true,
                    'urutan' => $index + 1,
                ]
            );
        }
    }
}
