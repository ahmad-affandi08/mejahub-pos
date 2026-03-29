<?php

namespace App\Modules\Inventory\PenerimaanBarang;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PenerimaanBarangCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PenerimaanBarangEntity $item) => self::toItem($item))
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

	public static function toItem(PenerimaanBarangEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'purchase_order_id' => $item->purchase_order_id,
			'purchase_order_kode' => $item->purchaseOrder?->kode,
			'supplier_id' => $item->supplier_id,
			'supplier_nama' => $item->supplier?->nama,
			'nomor_surat_jalan' => $item->nomor_surat_jalan,
			'tanggal_terima' => optional($item->tanggal_terima)?->toDateString(),
			'status' => $item->status,
			'total' => (float) $item->total,
			'catatan' => $item->catatan,
			'items' => $item->items?->map(fn (PenerimaanBarangItemEntity $detail) => [
				'id' => $detail->id,
				'purchase_order_item_id' => $detail->purchase_order_item_id,
				'bahan_baku_id' => $detail->bahan_baku_id,
				'bahan_baku_nama' => $detail->bahanBaku?->nama,
				'qty_diterima' => (float) $detail->qty_diterima,
				'qty_input' => (float) ($detail->qty_input ?: $detail->qty_diterima),
				'satuan_input' => $detail->satuan_input ?: ($detail->bahanBaku?->satuan_kecil ?: $detail->bahanBaku?->satuan),
				'konversi_ke_kecil' => (float) ($detail->konversi_ke_kecil ?: 1),
				'harga_satuan' => (float) $detail->harga_satuan,
				'subtotal' => (float) $detail->subtotal,
				'catatan' => $detail->catatan,
			])->values()->all() ?? [],
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
