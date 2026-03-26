<?php

namespace App\Modules\Inventory\OpnameStok;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OpnameStokService
{
	public function paginate(string $search = '', int $perPage = 10): LengthAwarePaginator
	{
		return OpnameStokEntity::query()
			->with('bahanBaku:id,nama')
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhereHas('bahanBaku', fn ($bahanQuery) => $bahanQuery->where('nama', 'like', '%' . $search . '%'));
				});
			})
			->latest('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function create(array $payload, ?int $userId = null): OpnameStokEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$bahan = BahanBakuEntity::query()->findOrFail((int) $payload['bahan_baku_id']);
			$stokSistem = (float) $bahan->stok_saat_ini;
			$stokFisik = (float) $payload['stok_fisik'];
			$selisih = $stokFisik - $stokSistem;

			$kode = trim((string) ($payload['kode'] ?? ''));
			if ($kode === '') {
				$kode = $this->generateCode();
			}

			$opname = OpnameStokEntity::query()->create([
				'bahan_baku_id' => $bahan->id,
				'user_id' => $userId,
				'kode' => $kode,
				'tanggal_opname' => $payload['tanggal_opname'] ?? now()->toDateString(),
				'stok_sistem' => $stokSistem,
				'stok_fisik' => $stokFisik,
				'selisih' => $selisih,
				'alasan' => $payload['alasan'] ?? null,
				'status' => $payload['status'] ?? 'posted',
			]);

			$bahan->update(['stok_saat_ini' => $stokFisik]);

			return $opname->load('bahanBaku:id,nama');
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$opname = OpnameStokEntity::query()->findOrFail($id);
			$bahan = BahanBakuEntity::query()->find($opname->bahan_baku_id);

			if (!$bahan) {
				throw new PosDomainException('Data bahan baku untuk opname tidak ditemukan.');
			}

			$bahan->update([
				'stok_saat_ini' => (float) $opname->stok_sistem,
			]);

			$opname->delete();
		});
	}

	private function generateCode(): string
	{
		do {
			$code = 'OPN-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (OpnameStokEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
