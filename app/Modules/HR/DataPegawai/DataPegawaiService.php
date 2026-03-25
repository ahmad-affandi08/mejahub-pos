<?php

namespace App\Modules\HR\DataPegawai;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DataPegawaiService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return DataPegawaiEntity::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search) {
                $query
                    ->where('nama', 'like', '%' . $search . '%')
                    ->orWhere('no_identitas', 'like', '%' . $search . '%')
                    ->orWhere('jabatan', 'like', '%' . $search . '%');
            })
            ->orderBy('nama')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): DataPegawaiEntity
    {
        return DB::transaction(function () use ($payload) {
            $user = $this->syncUser(null, $payload);

            return DataPegawaiEntity::query()->create([
                'user_id' => $user?->id,
                'no_identitas' => $payload['no_identitas'] ?? null,
                'nama' => $payload['nama'],
                'jabatan' => $payload['jabatan'] ?? null,
                'nomor_telepon' => $payload['nomor_telepon'] ?? null,
                'alamat' => $payload['alamat'] ?? null,
                'is_active' => (bool) ($payload['is_active'] ?? true),
            ]);
        });
    }

    public function update(int $id, array $payload): DataPegawaiEntity
    {
        return DB::transaction(function () use ($id, $payload) {
            $pegawai = DataPegawaiEntity::query()->with('user')->findOrFail($id);

            $user = $this->syncUser($pegawai->user, $payload);

            $pegawai->update([
                'user_id' => $user?->id,
                'no_identitas' => $payload['no_identitas'] ?? null,
                'nama' => $payload['nama'],
                'jabatan' => $payload['jabatan'] ?? null,
                'nomor_telepon' => $payload['nomor_telepon'] ?? null,
                'alamat' => $payload['alamat'] ?? null,
                'is_active' => (bool) ($payload['is_active'] ?? true),
            ]);

            return $pegawai->refresh()->load('user:id,name,email');
        });
    }

    public function delete(int $id): void
    {
        $pegawai = DataPegawaiEntity::query()->findOrFail($id);
        $pegawai->delete();
    }

    private function syncUser(?User $user, array $payload): ?User
    {
        $hasEmail = !empty($payload['email']);

        if (!$hasEmail) {
            return $user;
        }

        if (!$user) {
            return User::query()->create([
                'name' => $payload['nama'],
                'email' => $payload['email'],
                'password' => Hash::make($payload['password']),
            ]);
        }

        $updateData = [
            'name' => $payload['nama'],
            'email' => $payload['email'],
        ];

        if (!empty($payload['password'])) {
            $updateData['password'] = Hash::make($payload['password']);
        }

        $user->update($updateData);

        return $user->refresh();
    }
}
