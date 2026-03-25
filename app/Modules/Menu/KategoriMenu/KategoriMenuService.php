<?php

namespace App\Modules\Menu\KategoriMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KategoriMenuService
{
    public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
    {
        return KategoriMenuEntity::query()
            ->when($search !== '', function ($query) use ($search) {
                $query
                    ->where('nama', 'like', '%' . $search . '%')
                    ->orWhere('kode', 'like', '%' . $search . '%');
            })
            ->orderBy('urutan')
            ->orderBy('nama')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $payload): KategoriMenuEntity
    {
        return KategoriMenuEntity::create($payload);
    }

    public function update(int $id, array $payload): KategoriMenuEntity
    {
        $kategori = KategoriMenuEntity::query()->findOrFail($id);
        $kategori->update($payload);

        return $kategori->refresh();
    }

    public function delete(int $id): void
    {
        $kategori = KategoriMenuEntity::query()->findOrFail($id);
        $kategori->delete();
    }
}
