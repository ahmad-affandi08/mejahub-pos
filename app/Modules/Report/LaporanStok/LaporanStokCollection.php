<?php

namespace App\Modules\Report\LaporanStok;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\MutasiStok\MutasiStokEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class LaporanStokCollection
{
	public static function toDashboard(array $dashboard): array
	{
		/** @var Collection<int, BahanBakuEntity> $lowStocks */
		$lowStocks = $dashboard['low_stocks'];
		/** @var LengthAwarePaginator $mutations */
		$mutations = $dashboard['mutations'];

		return [
			'summary' => [
				'total_items' => (int) ($dashboard['summary']['total_items'] ?? 0),
				'low_stock_items' => (int) ($dashboard['summary']['low_stock_items'] ?? 0),
				'out_of_stock_items' => (int) ($dashboard['summary']['out_of_stock_items'] ?? 0),
				'total_stock_value' => (float) ($dashboard['summary']['total_stock_value'] ?? 0),
			],
			'low_stocks' => $lowStocks->map(fn (BahanBakuEntity $item) => self::toLowStockItem($item))->values()->all(),
			'mutations' => self::toMutations($mutations),
		];
	}

	public static function toMutations(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (MutasiStokEntity $item) => self::toMutationItem($item))
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

	private static function toLowStockItem(BahanBakuEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'supplier_nama' => $item->supplier?->nama,
			'satuan' => $item->satuan,
			'stok_saat_ini' => (float) $item->stok_saat_ini,
			'stok_minimum' => (float) $item->stok_minimum,
			'harga_beli_terakhir' => (float) $item->harga_beli_terakhir,
		];
	}

	private static function toMutationItem(MutasiStokEntity $item): array
	{
		return [
			'id' => $item->id,
			'reference_type' => $item->reference_type,
			'reference_id' => $item->reference_id,
			'reference_code' => $item->reference_code,
			'direction' => $item->direction,
			'bahan_baku_id' => $item->bahan_baku_id,
			'bahan_baku_nama' => $item->bahanBaku?->nama,
			'satuan' => $item->bahanBaku?->satuan,
			'user_nama' => $item->user?->name,
			'qty' => (float) $item->qty,
			'stok_sebelum' => $item->stok_sebelum !== null ? (float) $item->stok_sebelum : null,
			'stok_sesudah' => $item->stok_sesudah !== null ? (float) $item->stok_sesudah : null,
			'nilai_satuan' => $item->nilai_satuan !== null ? (float) $item->nilai_satuan : null,
			'nilai_total' => $item->nilai_total !== null ? (float) $item->nilai_total : null,
			'lokasi_asal' => $item->lokasi_asal,
			'lokasi_tujuan' => $item->lokasi_tujuan,
			'catatan' => $item->catatan,
			'occurred_at' => optional($item->occurred_at)?->toDateTimeString(),
			'created_at' => optional($item->created_at)?->toDateTimeString(),
		];
	}
}
