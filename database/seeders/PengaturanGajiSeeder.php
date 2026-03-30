<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanGaji\PengaturanGajiEntity;

class PengaturanGajiSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // Nama harus cocok dengan field `nama` di tabel data_pegawai
            ['nama' => 'MUHAMMAD ARFIAN NUR HUDA', 'gaji_pokok' => 2000000, 'lembur_per_jam' => 8333.33, 'potongan_per_izin' => 200000, 'bonus' => 1000000, 'is_active' => true],
            ['nama' => 'GINANJAR', 'gaji_pokok' => 1700000, 'lembur_per_jam' => 7083.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'ZAHFA', 'gaji_pokok' => 1700000, 'lembur_per_jam' => 7083.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'SHANTI', 'gaji_pokok' => 1500000, 'lembur_per_jam' => 6250, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'LENI', 'gaji_pokok' => 1700000, 'lembur_per_jam' => 7083.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'DANIEL', 'gaji_pokok' => 1700000, 'lembur_per_jam' => 7083.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'REZA', 'gaji_pokok' => 1400000, 'lembur_per_jam' => 5833.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'IRFAN', 'gaji_pokok' => 1400000, 'lembur_per_jam' => 5833.33, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'ESSA', 'gaji_pokok' => 1300000, 'lembur_per_jam' => 5416.67, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'RISMA', 'gaji_pokok' => 1200000, 'lembur_per_jam' => 5000, 'potongan_per_izin' => 40000, 'bonus' => 100000, 'is_active' => true],
            ['nama' => 'AFIFAH', 'gaji_pokok' => 1200000, 'lembur_per_jam' => 5000, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
            ['nama' => 'ARIF', 'gaji_pokok' => 1200000, 'lembur_per_jam' => 5000, 'potongan_per_izin' => 0, 'bonus' => 0, 'is_active' => true],
        ];

        foreach ($rows as $row) {
            $name = trim($row['nama']);

            $find = function (string $name) {
                $normalized = mb_strtolower(preg_replace('/\s+/', ' ', $name));

                // 1) exact match (case-insensitive)
                $one = DataPegawaiEntity::query()
                    ->whereRaw('LOWER(nama) = ?', [$normalized])
                    ->first();

                if ($one) {
                    return $one;
                }

                // 2) LIKE match
                $like = DataPegawaiEntity::query()
                    ->whereRaw('LOWER(nama) LIKE ?', ['%' . $normalized . '%'])
                    ->get();

                if ($like->count() === 1) {
                    return $like->first();
                }

                if ($like->count() > 1) {
                    // multiple matches — return first but warn
                    $this->command->warn("Beberapa pegawai cocok untuk '{$name}' — menggunakan: {$like->first()->nama}");
                    return $like->first();
                }

                // 3) token fallback: try first token
                $tokens = preg_split('/\s+/', $normalized);
                if (! empty($tokens)) {
                    $first = $tokens[0];
                    $tokenMatch = DataPegawaiEntity::query()
                        ->whereRaw('LOWER(nama) LIKE ?', ['%' . $first . '%'])
                        ->get();

                    if ($tokenMatch->count() === 1) {
                        return $tokenMatch->first();
                    }

                    if ($tokenMatch->count() > 1) {
                        $this->command->warn("Beberapa pegawai cocok untuk token '{$first}' — menggunakan: {$tokenMatch->first()->nama}");
                        return $tokenMatch->first();
                    }
                }

                return null;
            };

            $pegawai = $find($name);

            if (! $pegawai) {
                $this->command->warn("Pegawai tidak ditemukan: {$name} — lewati.");
                continue;
            }

            PengaturanGajiEntity::query()->updateOrCreate(
                ['pegawai_id' => $pegawai->id],
                [
                    'gaji_pokok' => (float) $row['gaji_pokok'],
                    'kebijakan_penggajian' => [
                        'aktifkan_kebijakan' => true,
                        'lembur_per_jam' => (float) ($row['lembur_per_jam'] ?? 0),
                        'lembur_min_menit' => 60,
                        'potong_izin' => (float) ($row['potongan_per_izin'] ?? 0) > 0,
                        'potongan_per_izin' => (float) ($row['potongan_per_izin'] ?? 0),
                        'potong_sakit' => false,
                        'potongan_per_sakit' => 0,
                        'potong_alpha' => true,
                        'potongan_per_alpha' => 0,
                        'potong_terlambat' => false,
                        'potongan_per_terlambat' => 0,
                    ],
                    'catatan' => isset($row['bonus']) && $row['bonus'] > 0 ? 'Bonus default: ' . number_format($row['bonus'], 0, '.', ',') : null,
                    'is_active' => (bool) ($row['is_active'] ?? true),
                ]
            );

            $this->command->info("Pengaturan gaji dibuat/diperbarui untuk: {$name}");
        }

        // Jika ada nama tertentu yang belum punya pengaturan, seed berdasarkan jabatan
        $ensureByName = ['RAGIL', 'RIAN', 'ANANDA'];

        $defaultByJabatan = [
            'kitchen' => 1700000,
            'waiters' => 1200000,
            'kasir' => 1500000,
            'barista' => 1400000,
            'dishwasher' => 1200000,
            'manajer' => 2000000,
        ];

        foreach ($ensureByName as $shortName) {
            $found = DataPegawaiEntity::query()
                ->whereRaw('LOWER(nama) LIKE ?', ['%' . mb_strtolower($shortName) . '%'])
                ->first();

            if (! $found) {
                $this->command->warn("Tidak menemukan pegawai untuk nama pendek: {$shortName}");
                continue;
            }

            $exists = PengaturanGajiEntity::query()->where('pegawai_id', $found->id)->exists();
            if ($exists) {
                $this->command->info("Pengaturan sudah ada untuk: {$found->nama}");
                continue;
            }

            $jabatanKey = strtolower(trim((string) $found->jabatan));
            $gajiPokok = $defaultByJabatan[$jabatanKey] ?? null;

            if ($gajiPokok === null) {
                $this->command->warn("Tidak ada default gaji untuk jabatan: {$found->jabatan} (pegawai: {$found->nama})");
                continue;
            }

            PengaturanGajiEntity::query()->create([
                'pegawai_id' => (int) $found->id,
                'gaji_pokok' => (float) $gajiPokok,
                'kebijakan_penggajian' => null,
                'catatan' => 'Auto-seed gaji pokok berdasarkan jabatan untuk nama pendek.',
                'is_active' => true,
            ]);

            $this->command->info("Pengaturan gaji (default jabatan) dibuat untuk: {$found->nama} — gaji_pokok: {$gajiPokok}");
        }
    }
}
