<?php

namespace App\Modules\Inventory\PurchaseOrder;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseOrderCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PurchaseOrderEntity $item) => self::toItem($item))
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

	public static function toItem(PurchaseOrderEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'supplier_id' => $item->supplier_id,
			'supplier_nama' => $item->supplier?->nama,
			'tanggal_po' => optional($item->tanggal_po)?->toDateString(),
			'status' => $item->status,
			'total' => (float) $item->total,
			'catatan' => $item->catatan,
			'items' => $item->items?->map(fn (PurchaseOrderItemEntity $detail) => [
				'id' => $detail->id,
				'bahan_baku_id' => $detail->bahan_baku_id,
				'bahan_baku_nama' => $detail->bahanBaku?->nama,
				'qty_pesan' => (float) $detail->qty_pesan,
				'qty_diterima' => (float) $detail->qty_diterima,
				'harga_satuan' => (float) $detail->harga_satuan,
				'subtotal' => (float) $detail->subtotal,
				'catatan' => $detail->catatan,
			])->values()->all() ?? [],
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
