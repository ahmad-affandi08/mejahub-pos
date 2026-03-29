<?php

namespace Database\Seeders;

use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\Menu\KategoriMenu\KategoriMenuEntity;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $petaKategori = KategoriMenuEntity::query()->pluck('id', 'nama');

        $daftarMenu = [
            ['nama_produk' => 'AIR MINERAL', 'kategori' => 'SOFT DRINK', 'harga_jual' => 7000, 'sku' => 'LIL50'],
            ['nama_produk' => 'AIR MINERAL', 'kategori' => 'SOFT DRINK', 'harga_jual' => 7000, 'sku' => 'LIL50'],
            ['nama_produk' => 'CAESAR', 'kategori' => 'WESTERN', 'harga_jual' => 31000, 'sku' => 'lil200'],
            ['nama_produk' => 'AMERICANO', 'kategori' => 'COFFEE', 'harga_jual' => 15000, 'sku' => 'LIL27'],
            ['nama_produk' => "AYAM BAKAR LI'L ESCAPE", 'kategori' => 'Maincourse', 'harga_jual' => 26000, 'sku' => 'LIL03'],
            ['nama_produk' => "AYAM GORENG LI'L ESCAPE", 'kategori' => 'Maincourse', 'harga_jual' => 26000, 'sku' => 'LIL04'],
            ['nama_produk' => 'BUTTERSCOTCH SEASALT', 'kategori' => 'COFFEE', 'harga_jual' => 21000, 'sku' => 'LIL37'],
            ['nama_produk' => 'CAFFELATTE', 'kategori' => 'COFFEE', 'harga_jual' => 17000, 'sku' => 'LIL29'],
            ['nama_produk' => 'CAPPUCINO', 'kategori' => 'COFFEE', 'harga_jual' => 17000, 'sku' => 'LIL28'],
            ['nama_produk' => 'CHICKEN KARAGE NANBAN', 'kategori' => 'Maincourse', 'harga_jual' => 22000, 'sku' => 'LIL07'],
            ['nama_produk' => 'CHICKEN STEAK', 'kategori' => 'WESTERN', 'harga_jual' => 31000, 'sku' => 'LIL01'],
            ['nama_produk' => 'CHIKEN STEAK + ICE TEA', 'kategori' => 'Paket Ramadhan', 'harga_jual' => 38000, 'sku' => 'LIL61'],
            ['nama_produk' => 'CHOCOLATE', 'kategori' => 'Non Coffee', 'harga_jual' => 18000, 'sku' => 'LIL33'],
            ['nama_produk' => 'CIRENG', 'kategori' => 'SNACK', 'harga_jual' => 11000, 'sku' => 'LIL17'],
            ['nama_produk' => 'COFFEE BUN', 'kategori' => 'PASTRY', 'harga_jual' => 10000, 'sku' => 'LIL25'],
            ['nama_produk' => 'COOKIES', 'kategori' => 'PASTRY', 'harga_jual' => null, 'sku' => 'LIL26'],
            ['nama_produk' => 'CORDON BLEU', 'kategori' => 'WESTERN', 'harga_jual' => 33000, 'sku' => 'LIL02'],
            ['nama_produk' => 'CREAMY CRISPY CHICKEN MUSHROOM', 'kategori' => 'Maincourse', 'harga_jual' => 22000, 'sku' => 'LIL11'],
            ['nama_produk' => 'DONAT KENTANG', 'kategori' => 'PASTRY', 'harga_jual' => 8000, 'sku' => 'LIL23'],
            ['nama_produk' => 'FETTUCINE CARBONARA', 'kategori' => 'PASTA', 'harga_jual' => 19000, 'sku' => 'LIL10'],
            ['nama_produk' => 'Filter Coffe', 'kategori' => 'COFFEE', 'harga_jual' => 15000, 'sku' => 'LIL64'],
            ['nama_produk' => 'FRENCH FRIES', 'kategori' => 'SNACK', 'harga_jual' => 13000, 'sku' => 'LIL51'],
            ['nama_produk' => 'GRILLED CHICKEN STEAK', 'kategori' => 'WESTERN', 'harga_jual' => 29000, 'sku' => 'LIL16'],
            ['nama_produk' => 'Hot Tea', 'kategori' => 'TEA', 'harga_jual' => 8000, 'sku' => 'Lil60'],
            ['nama_produk' => 'ICE BERRY COFFEE', 'kategori' => 'MOCKTAIL COFFE', 'harga_jual' => 22000, 'sku' => 'LIL48'],
            ['nama_produk' => 'ICE JERUK', 'kategori' => 'TEA', 'harga_jual' => 9000, 'sku' => 'LIL76'],
            ['nama_produk' => 'ICE TEA', 'kategori' => 'TEA', 'harga_jual' => 8000, 'sku' => 'LIL42'],
            ['nama_produk' => 'Japanese Ice Coffe', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL65'],
            ['nama_produk' => 'KOPI SUSU BUTTERSCOTCH', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL38'],
            ['nama_produk' => 'KOPI SUSU CARAMEL', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL52'],
            ['nama_produk' => 'KOPI SUSU GULA AREN', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL54'],
            ['nama_produk' => 'KOPI SUSU HAZELNUT', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL40'],
            ['nama_produk' => 'KOPI SUSU SALTED CARAMEL', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL39'],
            ['nama_produk' => 'Kopi Susu Vanilla', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL53'],
            ['nama_produk' => 'KOPSU GONDANG', 'kategori' => 'COFFEE', 'harga_jual' => 18000, 'sku' => 'LIL32'],
            ['nama_produk' => "KOPSU LI'L SERIES", 'kategori' => 'COFFEE', 'harga_jual' => 19000, 'sku' => 'LIL31'],
            ['nama_produk' => 'LEMON TEA', 'kategori' => 'TEA', 'harga_jual' => 15000, 'sku' => 'LIL43'],
            ['nama_produk' => 'LEMONADE AMERICANO', 'kategori' => 'MOCKTAIL COFFE', 'harga_jual' => 17000, 'sku' => 'LIL47'],
            ['nama_produk' => 'LYCHEE TEA', 'kategori' => 'TEA', 'harga_jual' => 15000, 'sku' => 'LIL45'],
            ['nama_produk' => 'MATCHA', 'kategori' => 'Non Coffee', 'harga_jual' => 22000, 'sku' => 'LIL36'],
            ['nama_produk' => 'MIE GORENG LIL ESCAPE', 'kategori' => 'Maincourse', 'harga_jual' => 19000, 'sku' => 'LIL72'],
            ['nama_produk' => 'MINERAL NESTLE', 'kategori' => 'SOFT DRINK', 'harga_jual' => 6000, 'sku' => 'LIL66'],
            ['nama_produk' => "MIX LI'L ESCAPE", 'kategori' => 'SNACK', 'harga_jual' => 24000, 'sku' => 'LIL18'],
            ['nama_produk' => 'MOCHACINO', 'kategori' => 'COFFEE', 'harga_jual' => 19000, 'sku' => 'LIL30'],
            ['nama_produk' => 'MONT BLACK COFFEE', 'kategori' => 'MOCKTAIL COFFE', 'harga_jual' => 25000, 'sku' => 'LIL49'],
            ['nama_produk' => "NASI GORENG LI'L ESCAPE", 'kategori' => 'Maincourse', 'harga_jual' => 22000, 'sku' => 'LIL05'],
            ['nama_produk' => 'NASI GORENG LOMBOK IJO', 'kategori' => 'Maincourse', 'harga_jual' => 21000, 'sku' => 'LIL06'],
            ['nama_produk' => 'NASI GORENG SEAFOOD', 'kategori' => 'Maincourse', 'harga_jual' => 27000, 'sku' => 'LIL70'],
            ['nama_produk' => 'Nasi Putih', 'kategori' => 'SNACK', 'harga_jual' => 4000, 'sku' => 'LIL63'],
            ['nama_produk' => 'NORI FRIES', 'kategori' => 'SNACK', 'harga_jual' => 13000, 'sku' => 'LIL20'],
            ['nama_produk' => 'Paket Ayam Bakar + Ice tea', 'kategori' => 'Paket Ramadhan', 'harga_jual' => 32000, 'sku' => 'LIL57'],
            ['nama_produk' => 'Paket Ayam Goreng + Ice Tea', 'kategori' => 'Paket Ramadhan', 'harga_jual' => 32000, 'sku' => 'LIL58'],
            ['nama_produk' => 'PEACH TEA', 'kategori' => 'TEA', 'harga_jual' => 12000, 'sku' => 'LIL44'],
            ['nama_produk' => 'Pisang Coklat', 'kategori' => 'SNACK', 'harga_jual' => 12000, 'sku' => 'LIL24'],
            ['nama_produk' => 'RB Kulit Crispy Daun Jeruk', 'kategori' => 'Maincourse', 'harga_jual' => 19000, 'sku' => 'LIL73'],
            ['nama_produk' => 'RED VELVET', 'kategori' => 'Non Coffee', 'harga_jual' => 16000, 'sku' => 'LIL34'],
            ['nama_produk' => 'RICA AYAM', 'kategori' => 'RICEBOWL', 'harga_jual' => 17000, 'sku' => 'LIL74'],
            ['nama_produk' => 'RICE BOWL AYAM HONGKONG', 'kategori' => 'RICEBOWL', 'harga_jual' => 20000, 'sku' => 'LIL14'],
            ['nama_produk' => 'RICE BOWL KARAGE NANBAN MATAH', 'kategori' => 'RICEBOWL', 'harga_jual' => 19000, 'sku' => 'LIL15'],
            ['nama_produk' => 'RICE BOWL KATSU MATAH', 'kategori' => 'RICEBOWL', 'harga_jual' => 18000, 'sku' => 'LIL13'],
            ['nama_produk' => 'RICE BOWL KATSU MATAH + ICE TEA', 'kategori' => 'Paket Ramadhan', 'harga_jual' => 25000, 'sku' => 'LIL62'],
            ['nama_produk' => 'Rice Bowl Nanban + Ice Tea', 'kategori' => 'Paket Ramadhan', 'harga_jual' => 26000, 'sku' => 'LIL59'],
            ['nama_produk' => 'RICE BOWL TERIYAKI', 'kategori' => 'RICEBOWL', 'harga_jual' => 17000, 'sku' => 'LIL12'],
            ['nama_produk' => 'RISOLE MAYO', 'kategori' => 'SNACK', 'harga_jual' => 10000, 'sku' => 'LIL22'],
            ['nama_produk' => 'ROCKSTAR FRIES', 'kategori' => 'SNACK', 'harga_jual' => null, 'sku' => 'LIL19'],
            ['nama_produk' => 'Singkong Keju', 'kategori' => 'SNACK', 'harga_jual' => 14000, 'sku' => 'LIL75'],
            ['nama_produk' => 'SOP IGA SAPI', 'kategori' => 'Maincourse', 'harga_jual' => 38000, 'sku' => 'LIL71'],
            ['nama_produk' => 'SPAGHETTI AGLIO OLIO', 'kategori' => 'PASTA', 'harga_jual' => 19000, 'sku' => 'LIL09'],
            ['nama_produk' => 'SPAGHETTI BOLOGNESE', 'kategori' => 'PASTA', 'harga_jual' => 19000, 'sku' => 'LIL08'],
            ['nama_produk' => 'Sunny Side Up', 'kategori' => 'SNACK', 'harga_jual' => 5000, 'sku' => 'LIL55'],
            ['nama_produk' => 'TARO', 'kategori' => 'Non Coffee', 'harga_jual' => 16000, 'sku' => 'LIL35'],
            ['nama_produk' => "TIMUS LIL' Escape", 'kategori' => 'SNACK', 'harga_jual' => 10000, 'sku' => 'LIL56'],
            ['nama_produk' => "TRADISIONAL LI'L ESCAPE", 'kategori' => 'SNACK', 'harga_jual' => 15000, 'sku' => 'LIL21'],
            ['nama_produk' => 'TRIPLE PEACH AMERICANO', 'kategori' => 'MOCKTAIL COFFE', 'harga_jual' => 19000, 'sku' => 'LIL46'],
            ['nama_produk' => 'VIETNAM COFFEE', 'kategori' => 'COFFEE', 'harga_jual' => 17000, 'sku' => 'LIL41'],
            ['nama_produk' => 'TUBRUK', 'kategori' => 'COFFEE', 'harga_jual' => 10000, 'sku' => 'LIL77'],
            ['nama_produk' => 'BLACK TEA & LEMON TEA', 'kategori' => 'TEA', 'harga_jual' => 10000, 'sku' => 'LIL78'],
            ['nama_produk' => 'BERRY TEA', 'kategori' => 'TEA', 'harga_jual' => 12000, 'sku' => 'LIL79'],

        ];

        foreach ($daftarMenu as $menu) {
            $idKategori = $petaKategori[$menu['kategori']] ?? null;

            if (!$idKategori) {
                throw new \RuntimeException('Kategori tidak ditemukan: ' . $menu['kategori']);
            }

            DataMenuEntity::query()->updateOrCreate(
                ['nama' => $menu['nama_produk']],
                [
                    'kode' => $menu['sku'],
                    'kategori_menu_id' => $idKategori,
                    'harga' => (float) ($menu['harga_jual'] ?? 0),
                    'deskripsi' => null,
                    'is_active' => true,
                ]
            );
        }
    }
}
