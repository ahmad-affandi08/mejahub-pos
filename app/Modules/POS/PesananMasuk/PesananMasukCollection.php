<?php

namespace App\Modules\POS\PesananMasuk;

use Illuminate\Support\Collection;

class PesananMasukCollection
{
	public static function toIndex(Collection $orders): array
	{
		return $orders
			->map(fn (PesananMasukEntity $order) => self::toItem($order))
			->values()
			->all();
	}

	public static function toItem(PesananMasukEntity $order): array
	{
		return [
			'id' => $order->id,
			'kode' => $order->kode,
			'status' => $order->status,
			'nama_pelanggan' => $order->nama_pelanggan,
			'data_meja_id' => $order->data_meja_id,
			'meja_nama' => $order->meja?->nama,
			'subtotal' => (float) $order->subtotal,
			'diskon' => (float) $order->diskon,
			'pajak' => (float) $order->pajak,
			'service_charge' => (float) $order->service_charge,
			'total' => (float) $order->total,
			'catatan' => $order->catatan,
			'waktu_pesan' => optional($order->waktu_pesan)?->toDateTimeString(),
			'items' => $order->items
				->map(fn (PesananMasukItemEntity $item) => [
					'id' => $item->id,
					'data_menu_id' => $item->data_menu_id,
					'nama_menu' => $item->nama_menu,
					'harga_satuan' => (float) $item->harga_satuan,
					'qty' => (int) $item->qty,
					'subtotal' => (float) $item->subtotal,
					'catatan' => $item->catatan,
				])
				->values()
				->all(),
		];
	}
}
