<?php

namespace App\Modules\Inventory\TransferStok;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\MutasiStok\MutasiStokService;
use App\Support\PosDomainException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferStokService
{
	public function __construct(private readonly MutasiStokService $mutasiStokService)
	{
	}

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

			$record = TransferStokEntity::query()->create([
				'bahan_baku_id' => $bahan->id,
				'user_id' => $userId,
				'kode' => $kode,
				'tanggal_transfer' => $payload['tanggal_transfer'] ?? now()->toDateString(),
				'lokasi_asal' => $lokasiAsal,
				'lokasi_tujuan' => $lokasiTujuan,
				'qty_transfer' => $qty,
				'catatan' => $payload['catatan'] ?? null,
				'status' => $payload['status'] ?? 'posted',
			]);

			$this->mutasiStokService->record([
				'bahan_baku_id' => $bahan->id,
				'user_id' => $userId,
				'reference_type' => 'TRANSFER_STOK',
				'reference_id' => $record->id,
				'reference_code' => $record->kode,
				'direction' => 'transfer',
				'qty' => $qty,
				'stok_sebelum' => (float) $bahan->stok_saat_ini,
				'stok_sesudah' => (float) $bahan->stok_saat_ini,
				'nilai_satuan' => (float) $bahan->harga_beli_terakhir,
				'nilai_total' => $qty * (float) $bahan->harga_beli_terakhir,
				'lokasi_asal' => $lokasiAsal,
				'lokasi_tujuan' => $lokasiTujuan,
				'catatan' => 'Transfer stok antar lokasi',
			]);

			return $record->load('bahanBaku:id,nama');
		});
	}

	public function delete(int $id): void
	{
		DB::transaction(function () use ($id) {
			$record = TransferStokEntity::query()->findOrFail($id);
			$bahan = BahanBakuEntity::query()->find($record->bahan_baku_id);

			if ($bahan) {
				$this->mutasiStokService->record([
					'bahan_baku_id' => $bahan->id,
					'user_id' => $record->user_id,
					'reference_type' => 'TRANSFER_STOK_DELETE',
					'reference_id' => $record->id,
					'reference_code' => $record->kode,
					'direction' => 'transfer_reversal',
					'qty' => (float) $record->qty_transfer,
					'stok_sebelum' => (float) $bahan->stok_saat_ini,
					'stok_sesudah' => (float) $bahan->stok_saat_ini,
					'nilai_satuan' => (float) $bahan->harga_beli_terakhir,
					'nilai_total' => (float) $record->qty_transfer * (float) $bahan->harga_beli_terakhir,
					'lokasi_asal' => $record->lokasi_asal,
					'lokasi_tujuan' => $record->lokasi_tujuan,
					'catatan' => 'Reversal transfer stok dihapus',
				]);
			}

			$record->delete();
		});
	}

	private function generateCode(): string
	{
		do {
			$code = 'TRF-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5));
		} while (TransferStokEntity::query()->where('kode', $code)->exists());

		return $code;
	}
}
