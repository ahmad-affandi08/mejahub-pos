<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\HR\HakAkses\HakAksesEntity;
use Illuminate\Database\Seeder;

class HakAksesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'kode' => 'owner',
                'nama' => 'Owner',
                'deskripsi' => 'Akses penuh seluruh modul.',
                'is_active' => true,
                'permissions' => ['*'],
                'emails' => ['owner@mejahub.local'],
            ],
            [
                'kode' => 'manager',
                'nama' => 'Manager Outlet',
                'deskripsi' => 'Akses operasional outlet dan laporan.',
                'is_active' => true,
                'permissions' => [
                    'menu.kategori-menu.access',
                    'hr.data-pegawai.access',
                    'hr.hak-akses.access',
                    'pos.pesanan-masuk.access',
                ],
                'emails' => ['manager@mejahub.local'],
            ],
            [
                'kode' => 'kasir',
                'nama' => 'Kasir Outlet',
                'deskripsi' => 'Akses transaksi POS harian.',
                'is_active' => true,
                'permissions' => [
                    'menu.kategori-menu.access',
                    'pos.pesanan-masuk.access',
                ],
                'emails' => ['kasir@mejahub.local'],
            ],
        ];

        foreach ($roles as $item) {
            $role = HakAksesEntity::query()->updateOrCreate(
                ['kode' => $item['kode']],
                [
                    'nama' => $item['nama'],
                    'deskripsi' => $item['deskripsi'],
                    'is_active' => $item['is_active'],
                ]
            );

            $role->permissions()->delete();

            foreach ($item['permissions'] as $permissionKey) {
                $role->permissions()->create([
                    'permission_key' => $permissionKey,
                ]);
            }

            $userIds = User::query()
                ->whereIn('email', $item['emails'])
                ->pluck('id')
                ->all();

            $role->users()->sync($userIds);
        }
    }
}
