<?php

namespace App\Modules\Finance\Pengeluaran;

use App\Modules\Finance\ArusKas\ArusKasService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PengeluaranService
{
	public const CATEGORY_OPTIONS = [
		'sewa',
		'utilitas',
		'gaji_harian',
		'marketing',
		'operasional_toko',
		'maintenance',
		'transportasi',
		'lainnya',
	];

	public function __construct(private readonly ArusKasService $arusKasService)
	{
	}

	public function paginate(string $search = '', int $perPage = 10, string $status = ''): LengthAwarePaginator
	{
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		return PengeluaranEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhere('kategori_biaya', 'like', '%' . $search . '%')
						->orWhere('deskripsi', 'like', '%' . $search . '%')
						->orWhere('vendor_nama', 'like', '%' . $search . '%')
						->orWhere('nomor_bukti', 'like', '%' . $search . '%');
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
		$base = PengeluaranEntity::query()->where('is_active', true);

		return [
			'total_pengeluaran' => (float) (clone $base)->where('status_approval', 'approved')->sum('nominal'),
			'draft_count' => (int) (clone $base)->where('status_approval', 'draft')->count(),
			'submitted_count' => (int) (clone $base)->where('status_approval', 'submitted')->count(),
			'approved_count' => (int) (clone $base)->where('status_approval', 'approved')->count(),
		];
	}

	public function create(array $payload, ?int $userId = null): PengeluaranEntity
	{
		$entity = PengeluaranEntity::query()->create([
			'kode' => $payload['kode'] ?? $this->generateKode(),
			'tanggal' => $payload['tanggal'],
			'kategori_biaya' => $payload['kategori_biaya'],
			'metode_pembayaran' => $payload['metode_pembayaran'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'status_approval' => $payload['status_approval'] ?? 'draft',
			'deskripsi' => $payload['deskripsi'],
			'vendor_nama' => $payload['vendor_nama'] ?? null,
			'nomor_bukti' => $payload['nomor_bukti'] ?? null,
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

	public function update(int $id, array $payload, ?int $userId = null): PengeluaranEntity
	{
		$entity = PengeluaranEntity::query()->findOrFail($id);

		$entity->update([
			'tanggal' => $payload['tanggal'],
			'kategori_biaya' => $payload['kategori_biaya'],
			'metode_pembayaran' => $payload['metode_pembayaran'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'deskripsi' => $payload['deskripsi'],
			'vendor_nama' => $payload['vendor_nama'] ?? null,
			'nomor_bukti' => $payload['nomor_bukti'] ?? null,
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
		$entity = PengeluaranEntity::query()->findOrFail($id);

		if ($entity->status_approval === 'approved') {
			abort(422, 'Pengeluaran yang sudah approved tidak bisa di-submit ulang.');
		}

		if ($entity->status_approval === 'submitted') {
			return;
		}

		$entity->update(['status_approval' => 'submitted']);
	}

	public function approve(int $id, ?int $userId = null): void
	{
		$entity = PengeluaranEntity::query()->findOrFail($id);

		if ($entity->status_approval !== 'submitted') {
			abort(422, 'Hanya pengeluaran berstatus submitted yang bisa di-approve.');
		}

		$entity->update([
			'status_approval' => 'approved',
			'approved_by' => $userId,
			'approved_at' => now(),
		]);

		$this->arusKasService->upsertSourceJournal('pengeluaran', $entity->id, [
			'tanggal' => optional($entity->tanggal)?->toDateString() ?? now()->toDateString(),
			'jenis_akun' => $entity->metode_pembayaran === 'kas' ? 'kas' : 'bank',
			'jenis_arus' => 'out',
			'referensi_kode' => $entity->kode,
			'kategori' => $entity->kategori_biaya,
			'deskripsi' => 'Pengeluaran operasional: ' . $entity->deskripsi,
			'nominal' => (float) $entity->nominal,
			'status' => 'posted',
			'created_by' => $entity->created_by,
			'approved_by' => $userId,
			'approved_at' => now(),
			'catatan' => $entity->catatan,
		], false);
	}

	public function reject(int $id, ?int $userId = null): void
	{
		$entity = PengeluaranEntity::query()->findOrFail($id);

		if (!in_array($entity->status_approval, ['submitted', 'approved'], true)) {
			abort(422, 'Hanya pengeluaran berstatus submitted/approved yang bisa di-reject.');
		}

		$entity->update([
			'status_approval' => 'rejected',
			'approved_by' => $userId,
			'approved_at' => now(),
		]);

		$this->arusKasService->deleteSourceJournals('pengeluaran', $entity->id);
	}

	public function delete(int $id): void
	{
		$entity = PengeluaranEntity::query()->findOrFail($id);
		$entity->delete();

		$this->arusKasService->deleteSourceJournals('pengeluaran', $entity->id);
	}

	private function generateKode(): string
	{
		return 'OUT-' . now()->format('Ymd-His');
	}
}
