<?php

namespace App\Modules\Inventory\TransferStok;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferStokService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return TransferStokEntity::query()
			->with('bahanBaku:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('lokasi_asal', 'like', '%' . $search . '%')
						->orWhere('lokasi_tujuan', 'like', '%' . $search . '%')
						->orWhereHas('bahanBaku', fn ($bahanQuery) => $bahanQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload, ?int $userId = null): TransferStokEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$qty = (float) $payload['qty_transfer'];
			$bahan = BahanBakuEntity::query()->findOrFail((int) $payload['bahan_baku_id']);

			if ($qty <= 0) {
				throw new PosDomainException('Qty transfer harus lebih besar dari 0.');
			}

			if ((float) $bahan->stok_saat_ini < $qty) {
				throw new PosDomainException('Stok bahan baku tidak cukup untuk transfer.');
			}

			$lokasiAsal = trim((string) $payload['lokasi_asal']);
			$lokasiTujuan = trim((string) $payload['lokasi_tujuan']);

			if ($lokasiAsal === $lokasiTujuan) {
				throw new PosDomainException('Lokasi asal dan tujuan transfer tidak boleh sama.');
			}

			$kode = trim((string) ($payload['kode'] ?? ''));
			if ($kode === '') {
				$kode = $this->generateCode();
			}

			return TransferStokEntity::query()->create([
				'bahan_baku_id' => $bahan->id,
				'user_id' => $userId,
				'kode' => $kode,
				'tanggal_transfer' => $payload['tanggal_transfer'] ?? now()->toDateString(),
				'lokasi_asal' => $lokasiAsal,
				'lokasi_tujuan' => $lokasiTujuan,
				'qty_transfer' => $qty,
				'catatan' => $payload['catatan'] ?? null,
				'status' => $payload['status'] ?? 'posted',
			])->load('bahanBaku:id,nama');
		});
	}

	public function delete(int $id): void
	{
		$record = TransferStokEntity::query()->findOrFail($id);
		$record->delete();
	}

	private function generateCode(): string
	{
		do {
			$code = 'TRF-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (TransferStokEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
