<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\HR\DataPegawai\DataPegawaiEntity;
use App\Modules\HR\HakAkses\HakAksesEntity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DataPegawaiKhususSeeder extends Seeder
{
	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		$rows = [
			[
				'no_identitas' => '3215086703070004',
				'nama' => 'Risma sari',
				'jabatan' => 'Waiters',
				'alamat' => 'Dungnolo Sragen kecamatan sambung macan',
				'nomor_telepon' => '088976933770',
				'email' => 'rismasari@gmail.com',
			],
			[
				'no_identitas' => '3313176309060001',
				'nama' => 'Afifah Zamrud Daren',
				'jabatan' => 'Waiters',
				'alamat' => 'Sebendo, RT 05 RW 01, Sidomukti, Jenawi, Karanganyar',
				'nomor_telepon' => '081312895527',
				'email' => 'ranandraptr@gmail.com',
			],
			[
				'no_identitas' => '3521136209020002',
				'nama' => 'Shanti setiawati',
				'jabatan' => 'Kasir',
				'alamat' => 'Pondok, rt 01/06, tambakboyo, mantingan, ngawi',
				'nomor_telepon' => '087896327967',
				'email' => 'santisetiawati2017@gmail.com',
			],
			[
				'no_identitas' => '3201024610030005',
				'nama' => 'Bernessawati Hilary Cahya Ningrum',
				'jabatan' => 'Kasir',
				'alamat' => 'Perum pesona prima karanggan , kel. Karangan kec. gunung putri, Kab. Bogor',
				'nomor_telepon' => '085891465796',
				'email' => 'bernessawatihilary@gmail.com',
			],
			[
				'no_identitas' => '3314070402010002',
				'nama' => 'Mohamad Irfan Nur Kholis',
				'jabatan' => 'Barista',
				'alamat' => 'Bangoan Rt18/Rw05, Toyogo, Sambungmacan, Sragen',
				'nomor_telepon' => '085895669901',
				'email' => 'ervan7191@gmail.com',
			],
			[
				'no_identitas' => '3314102504030001',
				'nama' => 'ARIF HIDAYAT',
				'jabatan' => 'Dishwasher',
				'alamat' => 'Totorejo kedungupit sragen RT 19/ RW 06',
				'nomor_telepon' => '087711245567',
				'email' => 'arifgaming46@gmail.com',
			],
			[
				'no_identitas' => '3314060408060004',
				'nama' => 'Ananda Wahid',
				'jabatan' => 'Waiters',
				'alamat' => 'Tlogojati,Plosorejo,Gondang,Sragen',
				'nomor_telepon' => '08812627379',
				'email' => 'wahidananda359@gmail.com',
			],
			[
				'no_identitas' => '3173052503001004',
				'nama' => 'Ahmad Daniel Solichin',
				'jabatan' => 'Kitchen',
				'alamat' => 'Toyogo, sambungmacan',
				'nomor_telepon' => '081288873915',
				'email' => 'ahmaddaniel062@gmail.com',
			],
			[
				'no_identitas' => '3314136702070001',
				'nama' => 'ZAHFA PUTRI ALIFA SHOBUBAH',
				'jabatan' => 'Kitchen',
				'alamat' => 'KRANGEAN RT 02 RW 01 NGLEBAK TAWANGMANGU',
				'nomor_telepon' => '089644125042',
				'email' => 'zahfaalifa163@gmail.com',
			],
			[
				'no_identitas' => '3314092103050002',
				'nama' => 'Ginanjar Eksa Safarudin',
				'jabatan' => 'Kitchen',
				'alamat' => 'kepoh rt29/rw00, wonotolo, gondang, sragen',
				'nomor_telepon' => '081229246113',
				'email' => 'ginanjareksa145@gmail.com',
			],
            [
				'no_identitas' => '1278010708000001',
				'nama' => 'AHMAD AFFANDI SIKUMBANG',
				'jabatan' => 'Admin',
				'alamat' => 'Jl. Djaka Tingkir, Perum Griya Harisma No. B4, Ngrampal, Sragen',
				'nomor_telepon' => '082272983859',
				'email' => 'ahmadaffandy008@gmail.com',
			],
		];

		$emails = array_column($rows, 'email');
		$noIdentitasList = array_column($rows, 'no_identitas');

		$existingUserIds = User::query()
			->whereIn('email', $emails)
			->pluck('id');

		DataPegawaiEntity::query()
			->withTrashed()
			->whereIn('no_identitas', $noIdentitasList)
			->orWhereIn('user_id', $existingUserIds)
			->forceDelete();

		if ($existingUserIds->isNotEmpty()) {
			DB::table('user_hak_akses')->whereIn('user_id', $existingUserIds)->delete();
			User::query()->whereIn('id', $existingUserIds)->delete();
		}

		$staffRole = HakAksesEntity::query()->where('kode', 'staff')->first();

		foreach ($rows as $item) {
			$namaUpper = mb_strtoupper((string) $item['nama'], 'UTF-8');

			$user = User::query()->updateOrCreate(
				['email' => $item['email']],
				[
					'name' => $namaUpper,
					'password' => Hash::make('12345678'),
				]
			);

			DataPegawaiEntity::query()->updateOrCreate(
				['no_identitas' => $item['no_identitas']],
				[
					'user_id' => $user->id,
					'nama' => $namaUpper,
					'jabatan' => (string) ($item['jabatan'] ?? 'Kitchen'),
					'nomor_telepon' => $item['nomor_telepon'],
					'alamat' => $item['alamat'],
					'is_active' => true,
				]
			);

			if ($staffRole) {
				$user->hakAkses()->syncWithoutDetaching([$staffRole->id]);
			}
		}
	}
}
