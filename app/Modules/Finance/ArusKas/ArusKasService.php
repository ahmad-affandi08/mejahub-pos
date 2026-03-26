<?php

namespace App\Modules\Finance\ArusKas;

use App\Modules\HR\Penggajian\PenggajianEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ArusKasService
{
	public function syncSystemJournals(): void
	{
		$this->syncFromPosPayments();
		$this->syncFromPayroll();
	}

	public function paginate(
		string $search = '',
		int $perPage = 10,
		?string $dateFrom = null,
		?string $dateTo = null,
		string $jenisAkun = ''
	): LengthAwarePaginator {
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		return ArusKasEntity::query()
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('referensi_kode', 'like', '%' . $search . '%')
						->orWhere('deskripsi', 'like', '%' . $search . '%')
						->orWhere('kategori', 'like', '%' . $search . '%')
						->orWhere('sumber_tipe', 'like', '%' . $search . '%');
				});
			})
			->when($dateFrom, fn ($query) => $query->whereDate('tanggal', '>=', $dateFrom))
			->when($dateTo, fn ($query) => $query->whereDate('tanggal', '<=', $dateTo))
			->when($jenisAkun !== '', fn ($query) => $query->where('jenis_akun', $jenisAkun))
			->orderByDesc('tanggal')
			->orderByDesc('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function rekonsiliasiPaginate(int $perPage = 10, string $jenisAkun = ''): LengthAwarePaginator
	{
		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

		return RekonsiliasiKasEntity::query()
			->when($jenisAkun !== '', fn ($query) => $query->where('jenis_akun', $jenisAkun))
			->orderByDesc('tanggal')
			->orderByDesc('id')
			->paginate($perPage)
			->withQueryString();
	}

	public function summary(?string $dateFrom = null, ?string $dateTo = null): array
	{
		$base = ArusKasEntity::query()
			->when($dateFrom, fn ($query) => $query->whereDate('tanggal', '>=', $dateFrom))
			->when($dateTo, fn ($query) => $query->whereDate('tanggal', '<=', $dateTo));

		$totalMasuk = (float) (clone $base)->where('jenis_arus', 'in')->sum('nominal');
		$totalKeluar = (float) (clone $base)->where('jenis_arus', 'out')->sum('nominal');
		$saldoKas = $this->accountBalance('kas', $dateTo);
		$saldoBank = $this->accountBalance('bank', $dateTo);

		return [
			'total_masuk' => $totalMasuk,
			'total_keluar' => $totalKeluar,
			'saldo_bersih' => $totalMasuk - $totalKeluar,
			'saldo_kas' => $saldoKas,
			'saldo_bank' => $saldoBank,
		];
	}

	public function createManual(array $payload, ?int $userId = null): ArusKasEntity
	{
		return ArusKasEntity::query()->create([
			'tanggal' => $payload['tanggal'],
			'jenis_akun' => $payload['jenis_akun'],
			'jenis_arus' => $payload['jenis_arus'],
			'sumber_tipe' => 'manual',
			'referensi_kode' => $payload['referensi_kode'] ?? null,
			'kategori' => $payload['kategori'] ?? 'lainnya',
			'deskripsi' => $payload['deskripsi'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'status' => $payload['status'] ?? 'posted',
			'rekonsiliasi_status' => 'unreconciled',
			'is_system' => false,
			'is_active' => (bool) ($payload['is_active'] ?? true),
			'created_by' => $userId,
			'catatan' => $payload['catatan'] ?? null,
		]);
	}

	public function updateManual(int $id, array $payload): ArusKasEntity
	{
		$item = ArusKasEntity::query()->findOrFail($id);

		if ((bool) $item->is_system) {
			abort(422, 'Jurnal sistem tidak bisa diedit manual.');
		}

		$item->update([
			'tanggal' => $payload['tanggal'],
			'jenis_akun' => $payload['jenis_akun'],
			'jenis_arus' => $payload['jenis_arus'],
			'referensi_kode' => $payload['referensi_kode'] ?? null,
			'kategori' => $payload['kategori'] ?? 'lainnya',
			'deskripsi' => $payload['deskripsi'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'status' => $payload['status'] ?? 'posted',
			'is_active' => (bool) ($payload['is_active'] ?? true),
			'catatan' => $payload['catatan'] ?? null,
		]);

		return $item->refresh();
	}

	public function deleteManual(int $id): void
	{
		$item = ArusKasEntity::query()->findOrFail($id);

		if ((bool) $item->is_system) {
			abort(422, 'Jurnal sistem tidak bisa dihapus manual.');
		}

		$item->delete();
	}

	public function createRekonsiliasi(array $payload, ?int $userId = null): RekonsiliasiKasEntity
	{
		$saldoSistem = $this->accountBalance($payload['jenis_akun'], $payload['tanggal']);
		$saldoAktual = (float) ($payload['saldo_aktual'] ?? 0);
		$selisih = $saldoAktual - $saldoSistem;

		$rekonsiliasi = RekonsiliasiKasEntity::query()->create([
			'tanggal' => $payload['tanggal'],
			'jenis_akun' => $payload['jenis_akun'],
			'saldo_sistem' => $saldoSistem,
			'saldo_aktual' => $saldoAktual,
			'selisih' => $selisih,
			'status' => abs($selisih) < 0.5 ? 'match' : 'selisih',
			'created_by' => $userId,
			'catatan' => $payload['catatan'] ?? null,
		]);

		ArusKasEntity::query()
			->where('jenis_akun', $payload['jenis_akun'])
			->whereDate('tanggal', '<=', $payload['tanggal'])
			->update([
				'rekonsiliasi_status' => 'reconciled',
			]);

		return $rekonsiliasi;
	}

	public function upsertSourceJournal(string $sourceType, int $sourceId, array $payload, bool $isSystem = false): ArusKasEntity
	{
		$journal = ArusKasEntity::query()->firstOrNew([
			'sumber_tipe' => $sourceType,
			'sumber_id' => $sourceId,
			'referensi_kode' => $payload['referensi_kode'] ?? null,
		]);

		$journal->fill([
			'tanggal' => $payload['tanggal'],
			'jenis_akun' => $payload['jenis_akun'] ?? 'bank',
			'jenis_arus' => $payload['jenis_arus'] ?? 'out',
			'kategori' => $payload['kategori'] ?? null,
			'deskripsi' => $payload['deskripsi'],
			'nominal' => (float) ($payload['nominal'] ?? 0),
			'status' => $payload['status'] ?? 'posted',
			'rekonsiliasi_status' => $payload['rekonsiliasi_status'] ?? 'unreconciled',
			'is_system' => $isSystem,
			'is_active' => true,
			'created_by' => $payload['created_by'] ?? null,
			'approved_by' => $payload['approved_by'] ?? null,
			'approved_at' => $payload['approved_at'] ?? null,
			'catatan' => $payload['catatan'] ?? null,
		]);

		$journal->save();

		return $journal->refresh();
	}

	public function deleteSourceJournals(string $sourceType, int $sourceId): void
	{
		ArusKasEntity::query()
			->where('sumber_tipe', $sourceType)
			->where('sumber_id', $sourceId)
			->delete();
	}

	private function syncFromPosPayments(): void
	{
		$payments = PembayaranEntity::query()
			->where('status', 'paid')
			->get(['id', 'kode', 'metode_bayar', 'nominal_tagihan', 'payment_details', 'waktu_bayar', 'user_id']);

		$paidPaymentIds = [];

		foreach ($payments as $payment) {
			$paidPaymentIds[] = (int) $payment->id;
			$desiredReferences = [];
			$details = collect($payment->payment_details ?? []);

			if ($details->isNotEmpty()) {
				foreach ($details->values() as $idx => $detail) {
					$method = strtolower(trim((string) ($detail['metode_bayar'] ?? '')));
					$nominal = (float) ($detail['nominal'] ?? 0);

					if ($method === '' || $nominal <= 0) {
						continue;
					}

					$referenceCode = $payment->kode . '-SPLIT-' . ($idx + 1);
					$desiredReferences[] = $referenceCode;

					$this->upsertSourceJournal('pos_payment', (int) $payment->id, [
						'tanggal' => optional($payment->waktu_bayar)?->toDateString() ?? now()->toDateString(),
						'jenis_akun' => $this->resolveAkunByPaymentMethod($method),
						'jenis_arus' => 'in',
						'referensi_kode' => $referenceCode,
						'kategori' => 'penjualan',
						'deskripsi' => 'Jurnal otomatis pembayaran POS (' . strtoupper($method) . ')',
						'nominal' => $nominal,
						'status' => 'posted',
						'created_by' => $payment->user_id,
					], true);
				}

				$this->deleteStaleSourceJournals('pos_payment', (int) $payment->id, $desiredReferences);

				continue;
			}

			$method = strtolower(trim((string) ($payment->metode_bayar ?? 'cash')));
			$desiredReferences[] = $payment->kode;

			$this->upsertSourceJournal('pos_payment', (int) $payment->id, [
				'tanggal' => optional($payment->waktu_bayar)?->toDateString() ?? now()->toDateString(),
				'jenis_akun' => $this->resolveAkunByPaymentMethod($method),
				'jenis_arus' => 'in',
				'referensi_kode' => $payment->kode,
				'kategori' => 'penjualan',
				'deskripsi' => 'Jurnal otomatis pembayaran POS',
				'nominal' => (float) $payment->nominal_tagihan,
				'status' => 'posted',
				'created_by' => $payment->user_id,
			], true);

			$this->deleteStaleSourceJournals('pos_payment', (int) $payment->id, $desiredReferences);
		}

		$this->deleteOrphanSourceJournals('pos_payment', $paidPaymentIds);
	}

	private function syncFromPayroll(): void
	{
		$items = PenggajianEntity::query()
			->where('is_active', true)
			->where('status', 'dibayar')
			->get(['id', 'kode', 'tanggal_pembayaran', 'total_gaji']);

		$activePayrollIds = [];

		foreach ($items as $item) {
			$activePayrollIds[] = (int) $item->id;
			$referenceCode = $item->kode ?: 'PAYROLL-' . $item->id;

			$this->upsertSourceJournal('payroll', (int) $item->id, [
				'tanggal' => optional($item->tanggal_pembayaran)?->toDateString() ?? now()->toDateString(),
				'jenis_akun' => 'bank',
				'jenis_arus' => 'out',
				'referensi_kode' => $referenceCode,
				'kategori' => 'penggajian',
				'deskripsi' => 'Jurnal otomatis pembayaran gaji',
				'nominal' => (float) $item->total_gaji,
				'status' => 'posted',
			], true);

			$this->deleteStaleSourceJournals('payroll', (int) $item->id, [$referenceCode]);
		}

		$this->deleteOrphanSourceJournals('payroll', $activePayrollIds);
	}

	private function deleteStaleSourceJournals(string $sourceType, int $sourceId, array $keepReferences): void
	{
		$query = ArusKasEntity::query()
			->where('sumber_tipe', $sourceType)
			->where('sumber_id', $sourceId);

		if (!empty($keepReferences)) {
			$query->whereNotIn('referensi_kode', $keepReferences);
		}

		$query->delete();
	}

	private function deleteOrphanSourceJournals(string $sourceType, array $activeSourceIds): void
	{
		$query = ArusKasEntity::query()->where('sumber_tipe', $sourceType);

		if (!empty($activeSourceIds)) {
			$query->whereNotIn('sumber_id', $activeSourceIds);
		}

		$query->delete();
	}

	private function resolveAkunByPaymentMethod(string $method): string
	{
		$cashCodes = ['cash', 'tunai'];

		return in_array($method, $cashCodes, true) ? 'kas' : 'bank';
	}

	private function accountBalance(string $jenisAkun, ?string $untilDate = null): float
	{
		$query = ArusKasEntity::query()->where('jenis_akun', $jenisAkun);

		if ($untilDate) {
			$query->whereDate('tanggal', '<=', $untilDate);
		}

		$masuk = (float) (clone $query)->where('jenis_arus', 'in')->sum('nominal');
		$keluar = (float) (clone $query)->where('jenis_arus', 'out')->sum('nominal');

		return $masuk - $keluar;
	}
}
