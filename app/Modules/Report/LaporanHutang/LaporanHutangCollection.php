<?php

namespace App\Modules\Report\LaporanHutang;

class LaporanHutangCollection
{
	public static function toDashboard(array $dashboard): array
	{
		return [
			'summary' => $dashboard['summary'] ?? [],
			'aging' => $dashboard['aging'] ?? [],
			'per_supplier' => $dashboard['per_supplier'] ?? [],
			'recent_due' => $dashboard['recent_due'] ?? [],
		];
	}
}
