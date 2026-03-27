<?php

namespace App\Modules\Finance\PettyCash;

use App\Modules\Finance\ArusKas\ArusKasService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PettyCashService
{
	public function __construct(private readonly ArusKasService $arusKasService)
	{
	}

	public function paginate(string $search = '', int $perPage = 10, string $status = ''): LengthAwarePaginator
	{
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		return PettyCashEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('jenis_transaksi', 'like', '%' . $search . '%')
						->orWhere('deskripsi', 'like', '%' . $search . '%');
				});
			})
			->when($status !== '', fn ($query) => $query->where('status_approval', $status))
			->orderByDesc('tanggal')
			->orderByDesc('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function summary(): array
	{
		$base = PettyCashEntity::query()->where('is_active', true);

		return [
			'saldo_akhir' => $this->currentBalance(),
			'total_in' => (float) (clone $base)->where('status_approval', 'approved')->where('jenis_arus', 'in')->sum('nominal'),
			'total_out' => (float) (clone $base)->where('status_approval', 'approved')->where('jenis_arus', 'out')->sum('nominal'),
			'submitted_count' => (int) (clone $base)->where('status_approval', 'submitted')->count(),
		];
	}

	public function create(array $payload, ?int $userId = null): PettyCashEntity
	{
		$entity = PettyCashEntity::query()->create([
			'kode' => $payload['kode'] ?? $this->generateKode(),
			'tanggal' => $payload['tanggal'],
			'jenis_transaksi' => $payload['jenis_transaksi'],
			'jenis_arus' => $payload['jenis_arus'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'saldo_setelah' => $this->currentBalance(),
			'status_approval' => $payload['status_approval'] ?? 'draft',
			'deskripsi' => $payload['deskripsi'],
			'bahan_baku_id' => $payload['bahan_baku_id'] ?? null,
			'qty_bahan' => isset($payload['qty_bahan']) ? (float) $payload['qty_bahan'] : null,
			'created_by' => $userId,
			'catatan' => $payload['catatan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);

		if ($entity->status_approval === 'approved') {
			$this->approve($entity->id, $userId);
			return $entity->fresh();
		}

		return $entity;
	}

	public function update(int $id, array $payload, ?int $userId = null): PettyCashEntity
	{
		$entity = PettyCashEntity::query()->findOrFail($id);

		$entity->update([
			'tanggal' => $payload['tanggal'],
			'jenis_transaksi' => $payload['jenis_transaksi'],
			'jenis_arus' => $payload['jenis_arus'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'deskripsi' => $payload['deskripsi'],
			'bahan_baku_id' => $payload['bahan_baku_id'] ?? null,
			'qty_bahan' => isset($payload['qty_bahan']) ? (float) $payload['qty_bahan'] : null,
			'catatan' => $payload['catatan'] ?? null,
			'is_active' => (bool) ($payload['is_active'] ?? true),
		]);

		if (($payload['action'] ?? '') === 'submit') {
			$this->submit($entity->id);
		}

		if (($payload['action'] ?? '') === 'approve') {
			$this->approve($entity->id, $userId);
		}

		if (($payload['action'] ?? '') === 'reject') {
			$this->reject($entity->id, $userId);
		}

		return $entity->fresh();
	}

	public function submit(int $id): void
	{
		$entity = PettyCashEntity::query()->findOrFail($id);

		if ($entity->status_approval === 'approved') {
			abort(422, 'Petty cash yang sudah approved tidak bisa di-submit ulang.');
		}

		if ($entity->status_approval === 'submitted') {
			return;
		}

		$entity->update(['status_approval' => 'submitted']);
	}

	public function approve(int $id, ?int $userId = null): void
	{
		$entity = PettyCashEntity::query()->findOrFail($id);

		if ($entity->status_approval !== 'submitted') {
			abort(422, 'Hanya petty cash berstatus submitted yang bisa di-approve.');
		}

		$saldoSebelum = $this->currentBalance($entity->id);
		$delta = $entity->jenis_arus === 'in' ? (float) $entity->nominal : -1 * (float) $entity->nominal;

		$entity->update([
			'status_approval' => 'approved',
			'approved_by' => $userId,
			'approved_at' => now(),
			'saldo_setelah' => $saldoSebelum + $delta,
		]);

		$this->arusKasService->upsertSourceJournal('petty_cash', $entity->id, [
			'tanggal' => optional($entity->tanggal)?->toDateString() ?? now()->toDateString(),
			'jenis_akun' => 'kas',
			'jenis_arus' => $entity->jenis_arus,
			'referensi_kode' => $entity->kode,
			'kategori' => 'petty_cash',
			'deskripsi' => 'Petty cash: ' . $entity->deskripsi,
			'nominal' => (float) $entity->nominal,
			'status' => 'posted',
			'created_by' => $entity->created_by,
			'approved_by' => $userId,
			'approved_at' => now(),
			'catatan' => $entity->catatan,
		], false);

		if ($entity->bahan_baku_id && $entity->qty_bahan > 0) {
			$bahanBaku = \App\Modules\Inventory\BahanBaku\BahanBakuEntity::query()->find($entity->bahan_baku_id);
			if ($bahanBaku) {
				$bahanBaku->stok_saat_ini += (float) $entity->qty_bahan;
				$bahanBaku->harga_beli_terakhir = (float) $entity->nominal / (float) $entity->qty_bahan;
				$bahanBaku->save();
			}
		}
	}

	public function reject(int $id, ?int $userId = null): void
	{
		$entity = PettyCashEntity::query()->findOrFail($id);

		if (!in_array($entity->status_approval, ['submitted', 'approved'], true)) {
			abort(422, 'Hanya petty cash berstatus submitted/approved yang bisa di-reject.');
		}

		$entity->update([
			'status_approval' => 'rejected',
			'approved_by' => $userId,
			'approved_at' => now(),
		]);

		$this->arusKasService->deleteSourceJournals('petty_cash', $entity->id);

		if ($entity->getOriginal('status_approval') === 'approved' && $entity->bahan_baku_id && $entity->qty_bahan > 0) {
			$bahanBaku = \App\Modules\Inventory\BahanBaku\BahanBakuEntity::query()->find($entity->bahan_baku_id);
			if ($bahanBaku) {
				$bahanBaku->stok_saat_ini -= (float) $entity->qty_bahan;
				$bahanBaku->save();
			}
		}
	}

	public function delete(int $id): void
	{
		$entity = PettyCashEntity::query()->findOrFail($id);
		$entity->delete();

		$this->arusKasService->deleteSourceJournals('petty_cash', $entity->id);
	}

	private function currentBalance(?int $excludeId = null): float
	{
		$query = PettyCashEntity::query()->where('status_approval', 'approved');

		if ($excludeId) {
			$query->where('id', '!=', $excludeId);
		}

		$in = (float) (clone $query)->where('jenis_arus', 'in')->sum('nominal');
		$out = (float) (clone $query)->where('jenis_arus', 'out')->sum('nominal');

		return $in - $out;
	}

	private function generateKode(): string
	{
		return 'PTC-' . now()->format('Ymd-His');
	}
}
