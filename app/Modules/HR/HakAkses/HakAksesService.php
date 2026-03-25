<?php

namespace App\Modules\HR\HakAkses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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
            $role = HakAksesEntity::query()->create([
                'kode' => $payload['kode'],
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

            $role->update([
                'kode' => $payload['kode'],
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
}
