<?php

namespace App\Modules\Inventory\ManajemenWaste;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManajemenWasteService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return ManajemenWasteEntity::query()
			->with('bahanBaku:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('kategori_waste', 'like', '%' . $search . '%')
						->orWhereHas('bahanBaku', fn ($bahanQuery) => $bahanQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload, ?int $userId = null): ManajemenWasteEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$bahan = BahanBakuEntity::query()->findOrFail((int) $payload['bahan_baku_id']);
			$qtyWaste = (float) $payload['qty_waste'];
			$stokSebelum = (float) $bahan->stok_saat_ini;

			if ($qtyWaste <= 0) {
				throw new PosDomainException('Qty waste harus lebih besar dari 0.');
			}

			if ($qtyWaste > $stokSebelum) {
				throw new PosDomainException('Qty waste melebihi stok saat ini.');
			}

			$stokSetelah = $stokSebelum - $qtyWaste;

			$kode = trim((string) ($payload['kode'] ?? ''));
			if ($kode === '') {
				$kode = $this->generateCode();
			}

			$record = ManajemenWasteEntity::query()->create([
				'bahan_baku_id' => $bahan->id,
				'user_id' => $userId,
				'kode' => $kode,
				'tanggal_waste' => $payload['tanggal_waste'] ?? now()->toDateString(),
				'stok_sebelum' => $stokSebelum,
				'qty_waste' => $qtyWaste,
				'stok_setelah' => $stokSetelah,
				'kategori_waste' => $payload['kategori_waste'] ?? null,
				'alasan' => $payload['alasan'] ?? null,
				'status' => $payload['status'] ?? 'posted',
			]);

			$bahan->update(['stok_saat_ini' => $stokSetelah]);

			return $record->load('bahanBaku:id,nama');
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$record = ManajemenWasteEntity::query()->findOrFail($id);
			$bahan = BahanBakuEntity::query()->find($record->bahan_baku_id);

			if ($bahan) {
				$bahan->update([
					'stok_saat_ini' => (float) $bahan->stok_saat_ini + (float) $record->qty_waste,
				]);
			}

			$record->delete();
		});
	}

	private function generateCode(): string
	{
		do {
			$code = 'WST-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (ManajemenWasteEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
