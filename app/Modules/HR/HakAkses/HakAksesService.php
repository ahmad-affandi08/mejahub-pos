<?php

namespace App\Modules\HR\HakAkses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HakAksesService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return HakAksesEntity::query()
            ->with(['permissions', 'users:id,name,email'])
            ->when($search !== '', function ($query) use ($search) {
                $query
                    ->where('nama', 'like', '%' . $search . '%')
                    ->orWhere('kode', 'like', '%' . $search . '%');
            })
            ->orderBy('nama')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): HakAksesEntity
    {
        return DB::transaction(function () use ($payload) {
            $normalizedKode = trim((string) ($payload['kode'] ?? ''));
            $existing = $this->findByKodeWithTrashed($normalizedKode);

            if ($existing && !$existing->trashed()) {
                throw ValidationException::withMessages([
                    'kode' => 'Kode role sudah digunakan. Gunakan kode lain.',
                ]);
            }

            if ($existing && $existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'kode' => $normalizedKode,
                    'nama' => $payload['nama'],
                    'deskripsi' => $payload['deskripsi'] ?? null,
                    'is_active' => (bool) ($payload['is_active'] ?? true),
                ]);

                $this->syncPermissions($existing, $payload['permissions'] ?? []);
                $this->syncUsers($existing, $payload['user_ids'] ?? []);

                return $existing->refresh()->load(['permissions', 'users:id,name,email']);
            }

            $role = HakAksesEntity::query()->create([
                'kode' => $normalizedKode,
                'nama' => $payload['nama'],
                'deskripsi' => $payload['deskripsi'] ?? null,
                'is_active' => (bool) ($payload['is_active'] ?? true),
            ]);

            $this->syncPermissions($role, $payload['permissions'] ?? []);
            $this->syncUsers($role, $payload['user_ids'] ?? []);

            return $role->refresh()->load(['permissions', 'users:id,name,email']);
        });
    }

    public function update(int $id, array $payload): HakAksesEntity
    {
        return DB::transaction(function () use ($id, $payload) {
            $role = HakAksesEntity::query()->findOrFail($id);
            $normalizedKode = trim((string) ($payload['kode'] ?? ''));
            $duplicate = $this->findByKodeWithTrashed($normalizedKode, $id);

            if ($duplicate) {
                throw ValidationException::withMessages([
                    'kode' => 'Kode role sudah digunakan. Gunakan kode lain.',
                ]);
            }

            $role->update([
                'kode' => $normalizedKode,
                'nama' => $payload['nama'],
                'deskripsi' => $payload['deskripsi'] ?? null,
                'is_active' => (bool) ($payload['is_active'] ?? true),
            ]);

            $this->syncPermissions($role, $payload['permissions'] ?? []);
            $this->syncUsers($role, $payload['user_ids'] ?? []);

            return $role->refresh()->load(['permissions', 'users:id,name,email']);
        });
    }

    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
            $role = HakAksesEntity::query()->findOrFail($id);

            $role->permissions()->delete();
            $role->users()->detach();
            $role->delete();
        });
    }

    private function syncPermissions(HakAksesEntity $role, array $permissions): void
    {
        $clean = collect($permissions)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique()
            ->values();

        $role->permissions()->delete();

        foreach ($clean as $permissionKey) {
            $role->permissions()->create([
                'permission_key' => $permissionKey,
            ]);
        }
    }

    private function syncUsers(HakAksesEntity $role, array $userIds): void
    {
        $cleanIds = collect($userIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        $role->users()->sync($cleanIds);
    }

    private function findByKodeWithTrashed(string $kode, ?int $exceptId = null): ?HakAksesEntity
    {
        $query = HakAksesEntity::query()
            ->withTrashed()
            ->whereRaw('LOWER(kode) = ?', [mb_strtolower($kode)]);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->first();
    }
}
