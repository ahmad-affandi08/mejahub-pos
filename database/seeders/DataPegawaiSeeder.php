<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use Illuminate\Database\Seeder;

class DataPegawaiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            [
                'email' => 'owner@mejahub.local',
                'no_identitas' => 'EMP-0001',
                'nama' => 'Owner Mejahub',
                'jabatan' => 'Owner',
                'nomor_telepon' => '081200000001',
                'alamat' => 'Kantor Pusat',
                'is_active' => true,
            ],
            [
                'email' => 'manager@mejahub.local',
                'no_identitas' => 'EMP-0002',
                'nama' => 'Manager Outlet',
                'jabatan' => 'Manager',
                'nomor_telepon' => '081200000002',
                'alamat' => 'Outlet Utama',
                'is_active' => true,
            ],
            [
                'email' => 'kasir@mejahub.local',
                'no_identitas' => 'EMP-0003',
                'nama' => 'Kasir Outlet',
                'jabatan' => 'Kasir',
                'nomor_telepon' => '081200000003',
                'alamat' => 'Outlet Utama',
                'is_active' => true,
            ],
        ];

        foreach ($rows as $item) {
            $user = User::query()->where('email', $item['email'])->first();

            if (!$user) {
                continue;
            }

            DataPegawaiEntity::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'no_identitas' => $item['no_identitas'],
                    'nama' => $item['nama'],
                    'jabatan' => $item['jabatan'],
                    'nomor_telepon' => $item['nomor_telepon'],
                    'alamat' => $item['alamat'],
                    'is_active' => $item['is_active'],
                ]
            );
        }
    }
}
