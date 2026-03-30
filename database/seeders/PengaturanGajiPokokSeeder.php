<?php

namespace Database\Seeders;

use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\PengaturanGaji\PengaturanGajiEntity;
use Illuminate\Database\Seeder;

class PengaturanGajiPokokSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultByJabatan = [
            'kitchen' => 1700000,
            'waiters' => 1200000,
            'kasir' => 1500000,
            'barista' => 1400000,
            'dishwasher' => 1200000,
            'manajer' => 2000000,
        ];

        $rows = [
            ['short_name' => 'MUHAMMAD ARFIAN NUR HUDA', 'gaji_pokok' => 2000000, 'aliases' => ['MUHAMMAD ARFIAN NUR HUDA', 'ARFIAN NUR HUDA']],
            ['short_name' => 'GINANJAR', 'gaji_pokok' => 1700000, 'aliases' => ['GINANJAR']],
            ['short_name' => 'ZAHFA', 'gaji_pokok' => 1700000, 'aliases' => ['ZAHFA']],
            ['short_name' => 'SHANTI', 'gaji_pokok' => 1500000, 'aliases' => ['SHANTI']],
            ['short_name' => 'LENI', 'gaji_pokok' => 1700000, 'aliases' => ['LENI']],
            ['short_name' => 'DANIEL', 'gaji_pokok' => 1700000, 'aliases' => ['DANIEL']],
            ['short_name' => 'RAGIL', 'gaji_pokok' => 1700000, 'aliases' => ['RAGIL']],
            ['short_name' => 'REZA', 'gaji_pokok' => 1400000, 'aliases' => ['REZA']],
            ['short_name' => 'IRFAN', 'gaji_pokok' => 1400000, 'aliases' => ['MOHAMAD IRFAN', 'IRFAN']],
            ['short_name' => 'ESSA', 'gaji_pokok' => 1300000, 'aliases' => ['ESSA', 'NESSA', 'BERNESSA']],
            ['short_name' => 'RISMA', 'gaji_pokok' => 1200000, 'aliases' => ['RISMA']],
            ['short_name' => 'AFIFAH', 'gaji_pokok' => 1200000, 'aliases' => ['AFIFAH']],
            ['short_name' => 'RIAN SUBEKTI', 'gaji_pokok' => 1200000, 'aliases' => ['RIAN SUBEKTI', 'RIAN']],
            ['short_name' => 'ARIF', 'gaji_pokok' => 1200000, 'aliases' => ['ARIF HIDAYAT', 'ARIF']],
        ];

        $missing = [];

        foreach ($rows as $item) {
            $pegawai = $this->findPegawaiByAliases($item['aliases']);

            if (!$pegawai) {
                $missing[] = $item['short_name'];
                continue;
            }

            PengaturanGajiEntity::query()->updateOrCreate(
                ['pegawai_id' => (int) $pegawai->id],
                [
                    'gaji_pokok' => (float) $item['gaji_pokok'],
                    'kebijakan_penggajian' => null,
                    'catatan' => 'Seed gaji pokok berdasarkan daftar nama pendek.',
                    'is_active' => true,
                ]
            );
        }

        if (!empty($missing) && $this->command) {
            $this->command->warn('PengaturanGajiPokokSeeder: nama tidak ditemukan -> ' . implode(', ', $missing));
        }

        $this->seedDefaultByJabatan($defaultByJabatan);
    }

    private function findPegawaiByAliases(array $aliases): ?DataPegawaiEntity
    {
        foreach ($aliases as $alias) {
            $needle = strtolower(trim((string) $alias));
            if ($needle === '') {
                continue;
            }

            $pegawai = DataPegawaiEntity::query()
                ->whereRaw('LOWER(nama) like ?', ['%' . $needle . '%'])
                ->orderByDesc('is_active')
                ->orderBy('id')
                ->first();

            if ($pegawai) {
                return $pegawai;
            }
        }

        return null;
    }

    private function seedDefaultByJabatan(array $defaultByJabatan): void
    {
        $pegawaiWithoutSalary = DataPegawaiEntity::query()
            ->where('is_active', true)
            ->whereNotIn('id', function ($query) {
                $query->select('pegawai_id')->from('pengaturan_gaji_pegawai')->whereNull('deleted_at');
            })
            ->get(['id', 'jabatan']);

        foreach ($pegawaiWithoutSalary as $pegawai) {
            $jabatanKey = strtolower(trim((string) $pegawai->jabatan));
            $gajiPokok = $defaultByJabatan[$jabatanKey] ?? null;

            if ($gajiPokok === null) {
                continue;
            }

            PengaturanGajiEntity::query()->updateOrCreate(
                ['pegawai_id' => (int) $pegawai->id],
                [
                    'gaji_pokok' => (float) $gajiPokok,
                    'kebijakan_penggajian' => null,
                    'catatan' => 'Seed default gaji pokok berdasarkan jabatan.',
                    'is_active' => true,
                ]
            );
        }
    }
}
