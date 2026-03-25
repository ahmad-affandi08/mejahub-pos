<?php

namespace App\Modules\HR\HakAkses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HakAksesCollection
{
    public static function toIndex(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn (HakAksesEntity $item) => self::toItem($item))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public static function toItem(HakAksesEntity $item): array
    {
        return [
            'id' => $item->id,
            'kode' => $item->kode,
            'nama' => $item->nama,
            'deskripsi' => $item->deskripsi,
            'is_active' => (bool) $item->is_active,
            'permissions' => $item->permissions->pluck('permission_key')->values()->all(),
            'user_ids' => $item->users->pluck('id')->values()->all(),
            'users' => $item->users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])->values()->all(),
            'created_at' => optional($item->created_at)?->toDateTimeString(),
            'updated_at' => optional($item->updated_at)?->toDateTimeString(),
        ];
    }
}
