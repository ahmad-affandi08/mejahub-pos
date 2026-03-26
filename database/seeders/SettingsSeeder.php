<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        DB::table('settings_profil_toko')->updateOrInsert(
            ['kode_toko' => 'MEJAHUB-001'],
            [
                'nama_toko' => 'MejaHub POS',
                'nama_brand' => 'MejaHub',
                'email' => 'hello@mejahub.local',
                'telepon' => '081234567890',
                'alamat' => 'Jl. Contoh No. 1',
                'kota' => 'Jakarta',
                'provinsi' => 'DKI Jakarta',
                'kode_pos' => '10110',
                'timezone' => 'Asia/Jakarta',
                'mata_uang' => 'IDR',
                'bahasa' => 'id',
                'is_default' => true,
                'is_active' => true,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $metodePembayaran = [
            ['kode' => 'cash', 'nama' => 'Cash', 'tipe' => 'cash', 'provider' => null, 'is_default' => true, 'urutan' => 1],
            ['kode' => 'qris', 'nama' => 'QRIS', 'tipe' => 'digital', 'provider' => 'QRIS', 'is_default' => false, 'urutan' => 2],
            ['kode' => 'debit', 'nama' => 'Debit Card', 'tipe' => 'card', 'provider' => 'EDC', 'is_default' => false, 'urutan' => 3],
            ['kode' => 'credit', 'nama' => 'Credit Card', 'tipe' => 'card', 'provider' => 'EDC', 'is_default' => false, 'urutan' => 4],
            ['kode' => 'transfer', 'nama' => 'Transfer Bank', 'tipe' => 'transfer', 'provider' => 'Bank', 'is_default' => false, 'urutan' => 5],
        ];

        foreach ($metodePembayaran as $item) {
            DB::table('settings_metode_pembayaran')->updateOrInsert(
                ['kode' => $item['kode']],
                [
                    'nama' => $item['nama'],
                    'tipe' => $item['tipe'],
                    'provider' => $item['provider'],
                    'nomor_rekening' => null,
                    'atas_nama' => null,
                    'biaya_persen' => 0,
                    'biaya_flat' => 0,
                    'is_active' => true,
                    'is_default' => $item['is_default'],
                    'requires_reference' => $item['kode'] !== 'cash',
                    'urutan' => $item['urutan'],
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        DB::table('settings_konfigurasi_pajak')->updateOrInsert(
            ['kode' => 'PPN11'],
            [
                'nama' => 'PPN 11%',
                'jenis' => 'percentage',
                'nilai' => 11,
                'applies_to' => 'subtotal',
                'is_inclusive' => false,
                'is_active' => true,
                'is_default' => true,
                'urutan' => 1,
                'keterangan' => 'Pajak default transaksi POS',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('settings_printer_silent')->updateOrInsert(
            ['kode' => 'PRN-RECEIPT-01'],
            [
                'nama' => 'Printer Receipt Kasir',
                'tipe_printer' => 'receipt',
                'connection_type' => 'network',
                'ip_address' => '192.168.1.50',
                'port' => 9100,
                'device_name' => 'Thermal Receipt',
                'paper_size' => '80mm',
                'copies' => 1,
                'auto_print_order' => false,
                'auto_print_payment' => true,
                'is_active' => true,
                'is_default' => true,
                'keterangan' => 'Default printer struk pembayaran',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
    }
}
