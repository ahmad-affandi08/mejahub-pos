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
                'kode' => 'admin',
                'nama' => 'Admin',
                'deskripsi' => 'Akses penuh seluruh modul.',
                'is_active' => true,
                'permissions' => ['*'],
                'emails' => ['admin@mejahub.local'],
            ],
            [
                'kode' => 'manager',
                'nama' => 'Manager Outlet',
                'deskripsi' => 'Akses operasional outlet dan laporan.',
                'is_active' => true,
                'permissions' => [
                    'dashboard.overview.access',
                    'menu.kategori-menu.access',
                    'menu.data-menu.access',
                    'menu.varian-menu.access',
                    'menu.modifier-menu.access',
                    'menu.paket-menu.access',
                    'meja.area-meja.access',
                    'meja.data-meja.access',
                    'meja.reservasi-meja.access',
                    'hr.data-pegawai.access',
                    'hr.hak-akses.access',
                    'hr.pengaturan-gaji.access',
                    'hr.penggajian.access',
                    'pos.buka-shift.access',
                    'pos.pesanan-masuk.access',
                    'pos.split-bill.access',
                    'pos.gabung-meja.access',
                    'pos.void-pesanan.access',
                    'pos.refund-pesanan.access',
                    'pos.pembayaran.access',
                    'pos.tutup-shift.access',
                ],
                'emails' => ['manager@mejahub.local'],
            ],
            [
                'kode' => 'kasir',
                'nama' => 'Kasir Outlet',
                'deskripsi' => 'Akses transaksi POS harian.',
                'is_active' => true,
                'permissions' => [
                    'dashboard.overview.access',
                    'menu.kategori-menu.access',
                    'menu.data-menu.access',
                    'menu.varian-menu.access',
                    'menu.modifier-menu.access',
                    'menu.paket-menu.access',
                    'meja.area-meja.access',
                    'meja.data-meja.access',
                    'meja.reservasi-meja.access',
                    'hr.data-pegawai.access',
                    'hr.hak-akses.access',
                    'hr.pengaturan-gaji.access',
                    'hr.penggajian.access',
                    'pos.buka-shift.access',
                    'pos.pesanan-masuk.access',
                    'pos.split-bill.access',
                    'pos.gabung-meja.access',
                    'pos.void-pesanan.access',
                    'pos.refund-pesanan.access',
                    'pos.pembayaran.access',
                    'pos.tutup-shift.access',
                ],
                'emails' => ['kasir@mejahub.local'],
            ],
            [
                'kode' => 'staff',
                'nama' => 'Staff',
                'deskripsi' => 'Akses aplikasi mobile e-absensi karyawan.',
                'is_active' => true,
                'permissions' => [
                    'hr.e-absensi.access',
                ],
                'emails' => ['staff@mejahub.local'],
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
