<?php

namespace App\Support;

use App\Modules\Settings\ProfilToko\ProfilTokoEntity;

trait ReportExportTrait
{
	public function storeProfileHeader(): array
	{
		$profile = ProfilTokoEntity::query()
			->where('is_active', true)
			->orderByDesc('is_default')
			->orderByDesc('id')
			->first();

		if (!$profile) {
			return [
				'nama_toko' => 'Mejahub POS',
				'nama_brand' => null,
				'kode_toko' => null,
				'alamat_lengkap' => '-',
				'telepon' => '-',
				'email' => '-',
				'npwp' => null,
			];
		}

		$alamat = collect([
			$profile->alamat,
			$profile->kota,
			$profile->provinsi,
			$profile->kode_pos,
		])->filter(fn ($item) => is_string($item) && trim($item) !== '')->implode(', ');

		return [
			'nama_toko' => $profile->nama_toko,
			'nama_brand' => $profile->nama_brand,
			'kode_toko' => $profile->kode_toko,
			'alamat_lengkap' => $alamat !== '' ? $alamat : '-',
			'telepon' => $profile->telepon ?: '-',
			'email' => $profile->email ?: '-',
			'npwp' => $profile->npwp,
		];
	}

	public function exportFileName(string $reportSlug, array $filters, string $exportType): string
	{
		$periodType = (string) ($filters['period_type'] ?? 'daily');
		$start = (string) ($filters['effective_range']['start'] ?? now()->toDateString());
		$end = (string) ($filters['effective_range']['end'] ?? now()->toDateString());

		$periodLabelMap = ['daily' => 'harian', 'weekly' => 'mingguan', 'monthly' => 'bulanan', 'custom' => 'custom'];
		$periodLabel = $periodLabelMap[$periodType] ?? 'harian';
		$safeStart = str_replace('-', '', $start);
		$safeEnd = str_replace('-', '', $end);
		$ext = strtolower($exportType) === 'pdf' ? 'pdf' : 'xls';

		return "{$reportSlug}-{$periodLabel}-{$safeStart}-sampai-{$safeEnd}.{$ext}";
	}

	public function renderPdfHtml(array $storeProfile, string $title, string $tableHtml, array $filters): string
	{
		return $this->buildBaseExportHtml($storeProfile, $title, $tableHtml, $filters, false);
	}

	public function renderExcelHtml(array $storeProfile, string $title, string $tableHtml, array $filters): string
	{
		return "\xEF\xBB\xBF" . $this->buildBaseExportHtml($storeProfile, $title, $tableHtml, $filters, true);
	}

	private function buildBaseExportHtml(array $sp, string $title, string $tableHtml, array $filters, bool $forExcel): string
	{
		$rangeLabel = (string) ($filters['effective_range']['label'] ?? '-');
		$headerStyle = $forExcel ? '' : 'style="font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #0f172a;"';

		return '<html><head><meta charset="UTF-8" />'
			. '<title>' . e($title) . '</title>'
			. '<style>
				body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #0f172a; }
				table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
				th, td { border: 1px solid #cbd5e1; padding: 6px; }
				th { background: #e2e8f0; text-align: left; }
				.section-title { font-size: 13px; font-weight: bold; margin: 14px 0 8px; }
			</style></head><body ' . $headerStyle . '>'
			. '<h2 style="margin:0;">' . e((string) ($sp['nama_toko'] ?? 'Mejahub POS')) . '</h2>'
			. (!empty($sp['nama_brand']) ? '<p style="margin:3px 0;">' . e((string) $sp['nama_brand']) . '</p>' : '')
			. '<p style="margin:3px 0;">Kode Toko: ' . e((string) ($sp['kode_toko'] ?? '-')) . '</p>'
			. '<p style="margin:3px 0;">Alamat: ' . e((string) ($sp['alamat_lengkap'] ?? '-')) . '</p>'
			. '<p style="margin:3px 0;">Telepon: ' . e((string) ($sp['telepon'] ?? '-')) . ' | Email: ' . e((string) ($sp['email'] ?? '-')) . '</p>'
			. (!empty($sp['npwp']) ? '<p style="margin:3px 0;">NPWP: ' . e((string) $sp['npwp']) . '</p>' : '')
			. '<hr />'
			. '<h3 style="margin:8px 0 4px;">' . e($title) . '</h3>'
			. '<p style="margin:0 0 10px;">Periode: ' . e($rangeLabel) . '</p>'
			. $tableHtml
			. '</body></html>';
	}

	protected function formatCurrency(float $value): string
	{
		return 'Rp ' . number_format($value, 0, ',', '.');
	}
}
