<?php

namespace App\Modules\POS\Pembayaran;

use App\Modules\Inventory\ResepBOM\ResepBOMConsumptionService;
use App\Modules\POS\BukaShift\BukaShiftEntity;
use App\Modules\POS\PesananMasuk\PesananMasukCollection;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Modules\Settings\MetodePembayaran\MetodePembayaranEntity;
use App\Modules\Settings\PrinterSilent\PrinterSilentEntity;
use App\Support\PosDomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PembayaranService
{
	public function __construct(private readonly ResepBOMConsumptionService $resepBOMConsumptionService)
	{
	}

	public function receiptHistory(string $search = '', int $perPage = 20)
	{
		return PembayaranEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->when($search !== '', function ($query) use ($search) {
				$query->where(function ($inner) use ($search) {
					$inner
						->where('kode', 'like', '%' . $search . '%')
						->orWhereHas('pesanan', function ($orderQuery) use ($search) {
							$orderQuery
								->where('kode', 'like', '%' . $search . '%')
								->orWhere('nama_pelanggan', 'like', '%' . $search . '%');
						});
				});
			})
			->latest('id')
			->paginate(max(1, min($perPage, 100)));
	}

	public function recentPayments(int $limit = 20)
	{
		return PembayaranEntity::query()
			->with(['pesanan.meja:id,nama', 'pesanan.items', 'kasir:id,name'])
			->latest('id')
			->limit($limit)
			->get();
	}

	public function pendingOrders(string $search = '')
	{
		return PesananMasukEntity::query()
			->with(['meja:id,nama', 'items'])
			->where('status', 'submitted')
			->when($search !== '', function ($query) use ($search) {
				$query
					->where('kode', 'like', '%' . $search . '%')
					->orWhere('nama_pelanggan', 'like', '%' . $search . '%');
			})
			->latest('id')
			->limit(50)
			->get();
	}

	public function activeShift(?int $userId = null): ?BukaShiftEntity
	{
		return BukaShiftEntity::query()
			->where('status', 'open')
			->when($userId, fn ($query) => $query->where('user_id', $userId))
			->latest('id')
			->first();
	}

	public function payOrder(array $payload, ?int $userId = null): PembayaranEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$order = PesananMasukEntity::query()
				->lockForUpdate()
				->findOrFail((int) $payload['pesanan_id']);

			if ($order->status !== 'submitted') {
				throw new PosDomainException('Pesanan tidak dalam status menunggu pembayaran.');
			}

			$nominalTagihan = (float) $order->total;
			$nominalDibayar = (float) $payload['nominal_dibayar'];

			if ($nominalDibayar < $nominalTagihan) {
				throw new PosDomainException('Nominal dibayar kurang dari total tagihan.');
			}

			$metodeBayar = trim((string) ($payload['metode_bayar'] ?? ''));
			$this->assertMetodePembayaranAktif($metodeBayar);

			$shift = $this->activeShift($userId);

			$payment = PembayaranEntity::query()->create([
				'pesanan_id' => $order->id,
				'shift_id' => $shift?->id,
				'user_id' => $userId,
				'kode' => $this->generateKode(),
				'metode_bayar' => $metodeBayar,
				'nominal_tagihan' => $nominalTagihan,
				'nominal_dibayar' => $nominalDibayar,
				'kembalian' => $nominalDibayar - $nominalTagihan,
				'status' => 'paid',
				'catatan' => $payload['catatan'] ?? null,
				'waktu_bayar' => now(),
			]);

			$order->update([
				'status' => 'paid',
				'waktu_bayar' => now(),
			]);

			$this->resepBOMConsumptionService->consumeForOrder($order->refresh()->load('items'), $userId);

			return $payment->refresh()->load('pesanan:id,kode');
		});
	}

	public function paymentConfiguration(): array
	{
		$methods = MetodePembayaranEntity::query()
			->where('is_active', true)
			->orderByDesc('is_default')
			->orderBy('urutan')
			->orderBy('nama')
			->get()
			->map(fn (MetodePembayaranEntity $item) => [
				'kode' => $item->kode,
				'nama' => $item->nama,
				'tipe' => $item->tipe,
				'is_default' => (bool) $item->is_default,
				'requires_reference' => (bool) $item->requires_reference,
			])
			->values()
			->all();

		$printers = PrinterSilentEntity::query()
			->where('is_active', true)
			->where('auto_print_payment', true)
			->orderByDesc('is_default')
			->orderBy('nama')
			->get()
			->map(fn (PrinterSilentEntity $item) => [
				'id' => $item->id,
				'kode' => $item->kode,
				'nama' => $item->nama,
				'tipe_printer' => $item->tipe_printer,
				'connection_type' => $item->connection_type,
				'ip_address' => $item->ip_address,
				'port' => $item->port,
				'device_name' => $item->device_name,
				'is_default' => (bool) $item->is_default,
				'copies' => (int) $item->copies,
			])
			->values()
			->all();

		$defaultMethod = collect($methods)->firstWhere('is_default', true);
		$defaultPrinter = collect($printers)->firstWhere('is_default', true);

		return [
			'methods' => $methods,
			'printers' => $printers,
			'default_method_code' => $defaultMethod['kode'] ?? ($methods[0]['kode'] ?? 'cash'),
			'default_printer_id' => $defaultPrinter['id'] ?? ($printers[0]['id'] ?? null),
			'auto_print_default' => $defaultPrinter !== null,
		];
	}

	public function toOrderPayload($orders): array
	{
		return $orders
			->map(fn (PesananMasukEntity $item) => PesananMasukCollection::toItem($item))
			->values()
			->all();
	}

	private function generateKode(): string
	{
		return 'PAY-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}

	private function assertMetodePembayaranAktif(string $metodeBayar): void
	{
		if ($metodeBayar === '') {
			throw new PosDomainException('Metode pembayaran wajib dipilih.');
		}

		$exists = MetodePembayaranEntity::query()
			->where('kode', $metodeBayar)
			->where('is_active', true)
			->exists();

		if (!$exists) {
			throw new PosDomainException('Metode pembayaran tidak aktif atau tidak ditemukan.');
		}
	}
}
