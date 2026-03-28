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
		$headerStyle = $forExcel ? '' : 'style="font-family: \'Times New Roman\', Arial, sans-serif; font-size: 11pt; color: #0f172a;"';
		$brand = !empty($sp['nama_brand']) ? (string) $sp['nama_brand'] : null;

		return '<html><head><meta charset="UTF-8" />'
			. '<title>' . e($title) . '</title>'
			. '<style>
				body { font-family: "Times New Roman", Arial, sans-serif; font-size: 11pt; color: #0f172a; margin: 0; padding: 12px; }
				.report-wrap { width: 100%; }
				.header-meta { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
				.header-meta td { border: none; padding: 1px 0; font-size: 10pt; vertical-align: top; }
				.store-title { font-size: 16pt; font-weight: 700; margin: 0 0 1px; line-height: 1.2; }
				.store-brand { font-size: 10pt; margin: 0 0 2px; line-height: 1.2; }
				.report-title { font-size: 12pt; font-weight: 700; margin: 0 0 2px; line-height: 1.2; }
				.report-period { font-size: 10pt; margin: 0; line-height: 1.2; }
				hr { margin: 8px 0 6px; border: 0; border-top: 1px solid #64748b; }
				table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
				th, td { border: 1px solid #cbd5e1; padding: 4px; font-size: 10pt; }
				th { background: #e2e8f0; text-align: left; }
				.section-title { font-size: 11pt; font-weight: 700; margin: 10px 0 6px; }
			</style></head><body ' . $headerStyle . '>'
			. '<div class="report-wrap">'
			. '<div class="store-title">' . e((string) ($sp['nama_toko'] ?? 'Mejahub POS')) . '</div>'
			. ($brand ? '<div class="store-brand">' . e($brand) . '</div>' : '')
			. '<table class="header-meta"><tbody>'
			. '<tr><td>Alamat: ' . e((string) ($sp['alamat_lengkap'] ?? '-')) . '</td></tr>'
			. '<tr><td>Telepon: ' . e((string) ($sp['telepon'] ?? '-')) . ' | Email: ' . e((string) ($sp['email'] ?? '-')) . '</td></tr>'
			. (!empty($sp['npwp']) ? '<tr><td>NPWP: ' . e((string) $sp['npwp']) . '</td></tr>' : '')
			. '</tbody></table>'
			. '<hr />'
			. '<div class="report-title">' . e($title) . '</div>'
			. '<div class="report-period">Periode: ' . e($rangeLabel) . '</div>'
			. $tableHtml
			. '</div>'
			. '</body></html>';
	}

	protected function formatCurrency(float $value): string
	{
		return 'Rp ' . number_format($value, 0, ',', '.');
	}
}
