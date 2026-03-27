<?php

namespace App\Modules\Report\LaporanKeuangan;

class LaporanKeuanganCollection
{
	public static function toDashboard(array $dashboard): array
	{
		return [
			'summary' => $dashboard['summary'] ?? [],
			'expense_breakdown' => $dashboard['expense_breakdown'] ?? [],
			'daily_trend' => $dashboard['daily_trend'] ?? [],
		];
	}
}
