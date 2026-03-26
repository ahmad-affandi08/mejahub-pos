<?php

namespace App\Modules\POS\PesananMasuk;

use App\Modules\Meja\DataMeja\DataMejaEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\Settings\KonfigurasiPajak\KonfigurasiPajakEntity;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PesananMasukService
{
	public function getReferenceData(string $search = ''): array
	{
		$menus = DataMenuEntity::query()
			->select(['id', 'kategori_menu_id', 'nama', 'harga', 'is_active', 'gambar'])
			->with('kategori:id,nama')
			->where('is_active', true)
			->when($search !== '', fn ($query) => $query->where('nama', 'like', '%' . $search . '%'))
			->orderBy('nama')
			->get()
			->map(fn (DataMenuEntity $menu) => [
				'id' => $menu->id,
				'nama' => $menu->nama,
				'kategori_nama' => $menu->kategori?->nama,
				'harga' => (float) $menu->harga,
				'gambar' => $menu->gambar,
				'is_active' => (bool) $menu->is_active,
			])
			->values()
			->all();

		$meja = DataMejaEntity::query()
			->select(['id', 'nama', 'nomor_meja', 'status', 'is_active'])
			->where('is_active', true)
			->orderBy('nama')
			->get()
			->map(fn (DataMejaEntity $item) => [
				'id' => $item->id,
				'nama' => $item->nama,
				'nomor_meja' => $item->nomor_meja,
				'status' => $item->status,
			])
			->values()
			->all();

		$activeOrders = PesananMasukEntity::query()
			->with(['meja:id,nama', 'items'])
			->whereIn('status', ['draft', 'submitted'])
			->latest('id')
			->limit(20)
			->get();

		return [
			'menus' => $menus,
			'meja' => $meja,
			'orders' => PesananMasukCollection::toIndex($activeOrders),
			'tax_config' => $this->getDefaultTaxConfig(),
		];
	}

	public function createOrder(array $payload, ?int $userId = null): PesananMasukEntity
	{
		return DB::transaction(function () use ($payload, $userId) {
			$itemsPayload = collect(Arr::get($payload, 'items', []));

			$menuMap = DataMenuEntity::query()
				->whereIn('id', $itemsPayload->pluck('data_menu_id')->filter()->all())
				->get()
				->keyBy('id');

			$lineItems = $itemsPayload
				->map(function (array $item) use ($menuMap) {
					$menuId = (int) ($item['data_menu_id'] ?? 0);
					$qty = max(1, (int) ($item['qty'] ?? 1));
					$menu = $menuMap->get($menuId);

					if (!$menu) {
						return null;
					}

					$harga = (float) $menu->harga;

					return [
						'data_menu_id' => $menuId,
						'nama_menu' => $menu->nama,
						'harga_satuan' => $harga,
						'qty' => $qty,
						'subtotal' => $harga * $qty,
						'catatan' => trim((string) ($item['catatan'] ?? '')) ?: null,
					];
				})
				->filter()
				->values();

			$subtotal = (float) $lineItems->sum('subtotal');
			$diskon = (float) ($payload['diskon'] ?? 0);
			$serviceCharge = (float) ($payload['service_charge'] ?? 0);
			$pajak = array_key_exists('pajak', $payload)
				? (float) ($payload['pajak'] ?? 0)
				: $this->resolveAutoTax($subtotal, $serviceCharge);

			$order = PesananMasukEntity::query()->create([
				'kode' => $this->generateKode(),
				'data_meja_id' => $payload['data_meja_id'] ?? null,
				'user_id' => $userId,
				'nama_pelanggan' => $payload['nama_pelanggan'] ?? null,
				'status' => $payload['status'] ?? 'submitted',
				'subtotal' => $subtotal,
				'diskon' => $diskon,
				'pajak' => $pajak,
				'service_charge' => $serviceCharge,
				'total' => $subtotal - $diskon + $pajak + $serviceCharge,
				'catatan' => $payload['catatan'] ?? null,
				'waktu_pesan' => now(),
			]);

			$order->items()->createMany($lineItems->all());

			return $order->load(['meja:id,nama', 'items']);
		});
	}

	public function updateStatus(int $id, string $status): PesananMasukEntity
	{
		$order = PesananMasukEntity::query()->findOrFail($id);
		$order->status = $status;

		if ($status === 'paid') {
			$order->waktu_bayar = now();
		}

		$order->save();

		return $order->refresh()->load(['meja:id,nama', 'items']);
	}

	private function generateKode(): string
	{
		return 'ORD-' . now()->format('Ymd-His') . '-' . Str::upper(Str::random(4));
	}

	private function getDefaultTaxConfig(): ?array
	{
		$tax = KonfigurasiPajakEntity::query()
			->where('is_active', true)
			->orderByDesc('is_default')
			->orderBy('urutan')
			->first();

		if (!$tax) {
			return null;
		}

		return [
			'id' => $tax->id,
			'kode' => $tax->kode,
			'nama' => $tax->nama,
			'jenis' => $tax->jenis,
			'nilai' => (float) $tax->nilai,
			'applies_to' => $tax->applies_to,
			'is_inclusive' => (bool) $tax->is_inclusive,
		];
	}

	private function resolveAutoTax(float $subtotal, float $serviceCharge): float
	{
		$tax = KonfigurasiPajakEntity::query()
			->where('is_active', true)
			->orderByDesc('is_default')
			->orderBy('urutan')
			->first();

		if (!$tax) {
			return 0;
		}

		$basis = match ($tax->applies_to) {
			'subtotal' => $subtotal,
			'service_charge' => $serviceCharge,
			default => $subtotal + $serviceCharge,
		};

		$nilai = (float) $tax->nilai;

		if ($tax->jenis === 'percentage') {
			return round(($basis * $nilai) / 100, 2);
		}

		return round($nilai, 2);
	}
}
