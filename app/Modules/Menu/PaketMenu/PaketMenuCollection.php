<?php

namespace App\Modules\Menu\PaketMenu;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaketMenuCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PaketMenuEntity $item) => self::toItem($item))
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

	public static function toItem(PaketMenuEntity $item): array
	{
		$itemRows = $item->items
			->sortBy('urutan')
			->values()
			->map(fn (PaketMenuItemEntity $detail) => [
				'data_menu_id' => $detail->data_menu_id,
				'nama' => $detail->dataMenu?->nama,
				'qty' => (float) $detail->qty,
			])
			->all();

		return [
			'id' => $item->id,
			'kategori_menu_id' => $item->kategori_menu_id,
			'kategori_nama' => $item->kategori?->nama,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'deskripsi' => $item->deskripsi,
			'harga_paket' => (float) $item->harga_paket,
			'is_active' => (bool) $item->is_active,
			'item_rows' => $itemRows,
			'item_summary' => collect($itemRows)
				->map(fn (array $row) => ($row['nama'] ?? '-') . ' x' . $row['qty'])
				->implode(', '),
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
