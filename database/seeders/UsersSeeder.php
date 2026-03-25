<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		$users = [
			[
				'name' => 'Owner Mejahub',
				'email' => 'owner@mejahub.local',
				'password' => 'password',
			],
			[
				'name' => 'Manager Outlet',
				'email' => 'manager@mejahub.local',
				'password' => 'password',
			],
			[
				'name' => 'Kasir Outlet',
				'email' => 'kasir@mejahub.local',
				'password' => 'password',
			],
		];

		foreach ($users as $item) {
			User::query()->updateOrCreate(
				['email' => $item['email']],
				[
					'name' => $item['name'],
					'password' => Hash::make($item['password']),
				]
			);
		}
	}
}

