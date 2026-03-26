<?php

namespace App\Modules\Report\LaporanStok;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\MutasiStok\MutasiStokEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LaporanStokService
{
	public function buildDashboard(string $search = '', int $perPage = 10, bool $lowStockOnly = false): array
	{
		$summary = $this->summary();
		$lowStocks = $this->lowStocks($search, $lowStockOnly);
		$mutations = $this->mutations($search, $perPage);

		return [
			'summary' => $summary,
			'low_stocks' => $lowStocks,
			'mutations' => $mutations,
		];
	}

	private function summary(): array
	{
		$totalItems = (int) BahanBakuEntity::query()->where('is_active', true)->count();
		$lowStockItems = (int) BahanBakuEntity::query()
			->where('is_active', true)
			->whereColumn('stok_saat_ini', '<=', 'stok_minimum')
			->count();
		$outOfStockItems = (int) BahanBakuEntity::query()
			->where('is_active', true)
			->where('stok_saat_ini', '<=', 0)
			->count();
		$totalStockValue = (float) BahanBakuEntity::query()
			->where('is_active', true)
			->selectRaw('COALESCE(SUM(stok_saat_ini * harga_beli_terakhir), 0) as total_value')
			->value('total_value');

		return [
			'total_items' => $totalItems,
			'low_stock_items' => $lowStockItems,
			'out_of_stock_items' => $outOfStockItems,
			'total_stock_value' => $totalStockValue,
		];
	}

	private function lowStocks(string $search, bool $lowStockOnly)
	{
		return BahanBakuEntity::query()
			->with('supplier:id,nama')
			->where('is_active', true)
			->when($lowStockOnly, fn ($query) => $query->whereColumn('stok_saat_ini', '<=', 'stok_minimum'))
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('nama', 'like', '%' . $search . '%')
						->orWhere('kode', 'like', '%' . $search . '%')
						->orWhere('satuan', 'like', '%' . $search . '%');
				});
			})
			->orderByRaw('CASE WHEN stok_saat_ini <= stok_minimum THEN 0 ELSE 1 END ASC')
			->orderBy('stok_saat_ini')
			->limit(50)
			->get();
	}

	private function mutations(string $search, int $perPage): LengthAwarePaginator
	{
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		return MutasiStokEntity::query()
			->with(['bahanBaku:id,nama,satuan', 'user:id,name'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('reference_code', 'like', '%' . $search . '%')
						->orWhere('reference_type', 'like', '%' . $search . '%')
						->orWhere('direction', 'like', '%' . $search . '%')
						->orWhereHas('bahanBaku', fn ($bahanQuery) => $bahanQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->orderByDesc('occurred_at')
			->orderByDesc('id')
			->paginate($perPage)
			->withQueryString();
	}
}
