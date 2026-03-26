<?php

namespace App\Modules\Settings\PrinterSilent;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PrinterSilentCollection
{
	public static function toIndex(LengthAwarePaginator $paginator): array
	{
		return [
			'data' => collect($paginator->items())
				->map(fn (PrinterSilentEntity $item) => self::toItem($item))
				->values()
				->all(),
			'meta' => [
				'current_page' => $paginator->currentPage(),
				'last_page' => $paginator->lastPage(),
				'per_page' => $paginator->perPage(),
				'total' => $paginator->total(),
			],
		];
	}

	public static function toItem(PrinterSilentEntity $item): array
	{
		return [
			'id' => $item->id,
			'kode' => $item->kode,
			'nama' => $item->nama,
			'tipe_printer' => $item->tipe_printer,
			'connection_type' => $item->connection_type,
			'ip_address' => $item->ip_address,
			'port' => $item->port,
			'device_name' => $item->device_name,
			'paper_size' => $item->paper_size,
			'copies' => (int) $item->copies,
			'auto_print_order' => (bool) $item->auto_print_order,
			'auto_print_payment' => (bool) $item->auto_print_payment,
			'is_active' => (bool) $item->is_active,
			'is_default' => (bool) $item->is_default,
			'keterangan' => $item->keterangan,
			'created_at' => optional($item->created_at)?->toDateTimeString(),
			'updated_at' => optional($item->updated_at)?->toDateTimeString(),
		];
	}
}
