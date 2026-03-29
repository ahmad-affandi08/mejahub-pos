<?php

namespace App\Modules\Report\ImportPenjualan;

use App\Modules\Inventory\BahanBaku\BahanBakuEntity;
use App\Modules\Inventory\ResepBOM\ResepBOMEntity;
use App\Modules\Menu\DataMenu\DataMenuEntity;
use App\Modules\POS\Pembayaran\PembayaranEntity;
use App\Modules\POS\PesananMasuk\PesananMasukEntity;
use App\Modules\POS\PesananMasuk\PesananMasukItemEntity;
use App\Modules\Report\ImportPenjualan\ImportPenjualanEntity;
use App\Modules\Settings\MetodePembayaran\MetodePembayaranEntity;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportPenjualanService
{
    private const SYNC_STATUS_PENDING = 'pending';
    private const SYNC_STATUS_SYNCED = 'synced';
    private const SYNC_STATUS_FAILED = 'failed';

    private const COLUMN_ALIASES = [
        'no_transaksi' => ['no transaksi', 'nomor transaksi', 'no trx', 'no trans'],
        'waktu_order' => ['waktu order', 'waktu transaksi'],
        'waktu_bayar' => ['waktu bayar', 'waktu pembayaran'],
        'outlet' => ['outlet'],
        'produk' => ['produk', 'menu'],
        'jenis_order' => ['jenis order', 'tipe order'],
        'sisa_tagihan' => ['sisa tagihan (rp.)', 'sisa tagihan (rp)', 'sisa tagihan'],
        'total_penjualan' => ['total penjualan (rp)', 'total penjualan (rp.)', 'total penjualan'],
        'metode_pembayaran' => ['metode pembayaran'],
        'bayar' => ['bayar', 'kasir bayar'],
        'nama_order' => ['order', 'nama order', 'kasir order'],
    ];

    public function paginate(string $search = '', string $batchCode = '', int $perPage = 20): LengthAwarePaginator
    {
        return ImportPenjualanEntity::query()
            ->when($batchCode !== '', function ($query) use ($batchCode) {
                $query->where('import_batch_code', $batchCode);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('import_batch_code', 'like', '%' . $search . '%')
                        ->orWhere('no_transaksi', 'like', '%' . $search . '%')
                        ->orWhere('outlet', 'like', '%' . $search . '%')
                        ->orWhere('produk', 'like', '%' . $search . '%')
                        ->orWhere('metode_pembayaran', 'like', '%' . $search . '%');
                });
            })
            ->orderByDesc('tanggal_transaksi')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function batchSummaries(int $limit = 10): array
    {
        return ImportPenjualanEntity::query()
            ->selectRaw('import_batch_code, MAX(created_at) as imported_at, COUNT(*) as total_rows, COALESCE(SUM(total_penjualan), 0) as total_penjualan')
            ->selectRaw("SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_rows")
            ->selectRaw("SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END) as failed_rows")
            ->selectRaw("SUM(CASE WHEN sync_status IS NULL OR sync_status = 'pending' THEN 1 ELSE 0 END) as pending_rows")
            ->groupBy('import_batch_code')
            ->orderByDesc('imported_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'import_batch_code' => (string) $row->import_batch_code,
                'imported_at' => $row->imported_at,
                'total_rows' => (int) $row->total_rows,
                'total_penjualan' => (float) $row->total_penjualan,
                'synced_rows' => (int) ($row->synced_rows ?? 0),
                'failed_rows' => (int) ($row->failed_rows ?? 0),
                'pending_rows' => (int) ($row->pending_rows ?? 0),
            ])
            ->values()
            ->all();
    }

    public function importFromFile(UploadedFile $file): array
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $batchCode = 'IMPRT-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4));
        $rows = $this->readRows($file, $extension);

        [$headerMap, $dataRows] = $this->extractDataRows($rows);

        $inserted = 0;
        $skipped = 0;

        DB::transaction(function () use (&$inserted, &$skipped, $headerMap, $dataRows, $batchCode, $file, $extension) {
            foreach ($dataRows as $index => $row) {
                $noTransaksi = $this->cellValue($row, $headerMap, 'no_transaksi');
                $produk = $this->cellValue($row, $headerMap, 'produk');

                if ($noTransaksi === '' && $produk === '') {
                    $skipped++;
                    continue;
                }

                $waktuOrder = $this->parseDateTime($this->cellValue($row, $headerMap, 'waktu_order'));
                $waktuBayar = $this->parseDateTime($this->cellValue($row, $headerMap, 'waktu_bayar'));
                $tanggalTransaksi = $waktuBayar?->toDateString() ?? $waktuOrder?->toDateString();

                ImportPenjualanEntity::query()->create([
                    'import_batch_code' => $batchCode,
                    'source_filename' => $file->getClientOriginalName(),
                    'source_extension' => $extension,
                    'row_number' => $index + 1,
                    'no_transaksi' => $noTransaksi,
                    'waktu_order' => $waktuOrder,
                    'waktu_bayar' => $waktuBayar,
                    'tanggal_transaksi' => $tanggalTransaksi,
                    'outlet' => $this->cellValue($row, $headerMap, 'outlet'),
                    'produk' => $produk,
                    'jenis_order' => $this->cellValue($row, $headerMap, 'jenis_order'),
                    'sisa_tagihan' => $this->parseMoney($this->cellValue($row, $headerMap, 'sisa_tagihan')),
                    'total_penjualan' => $this->parseMoney($this->cellValue($row, $headerMap, 'total_penjualan')),
                    'metode_pembayaran' => $this->cellValue($row, $headerMap, 'metode_pembayaran'),
                    'bayar' => $this->cellValue($row, $headerMap, 'bayar'),
                    'nama_order' => $this->cellValue($row, $headerMap, 'nama_order'),
                    'raw_row' => $row,
                    'is_active' => true,
                    'sync_status' => self::SYNC_STATUS_PENDING,
                ]);

                $inserted++;
            }
        });

        return [
            'batch_code' => $batchCode,
            'imported' => $inserted,
            'skipped' => $skipped,
        ];
    }

    public function syncBatchToPos(string $batchCode, ?int $userId = null, bool $onlyFailed = false): array
    {
        $batchCode = trim($batchCode);
        if ($batchCode === '') {
            throw new \RuntimeException('Batch code wajib diisi.');
        }

        $rows = ImportPenjualanEntity::query()
            ->where('import_batch_code', $batchCode)
            ->where(function ($query) use ($onlyFailed) {
                if ($onlyFailed) {
                    $query->where('sync_status', self::SYNC_STATUS_FAILED);
                    return;
                }

                $query
                    ->whereNull('sync_status')
                    ->orWhereIn('sync_status', [self::SYNC_STATUS_PENDING, self::SYNC_STATUS_FAILED]);
            })
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            return [
                'batch_code' => $batchCode,
                'total_rows' => 0,
                'synced_count' => 0,
                'failed_count' => 0,
                'skipped_count' => 0,
            ];
        }

        $methodMap = $this->buildPaymentMethodMap();
        $menuMap = $this->buildMenuMap();

        $syncedCount = 0;
        $failedCount = 0;
        $skippedCount = 0;

        foreach ($rows as $row) {
            try {
                $externalSyncKey = 'import-penjualan-row-' . $row->id;

                $existingPayment = PembayaranEntity::query()
                    ->where('external_sync_key', $externalSyncKey)
                    ->first();

                if ($existingPayment) {
                    $row->update([
                        'sync_status' => self::SYNC_STATUS_SYNCED,
                        'synced_at' => now(),
                        'sync_error' => null,
                        'pos_pembayaran_id' => $existingPayment->id,
                        'pos_pesanan_id' => $existingPayment->pesanan_id,
                    ]);
                    $skippedCount++;
                    continue;
                }

                DB::transaction(function () use ($row, $externalSyncKey, $methodMap, $menuMap, $userId) {
                    $items = $this->buildPosItemsForImportRow($row, $menuMap);

                    if (empty($items)) {
                        throw new \RuntimeException('Semua produk di baris ini belum terpetakan ke Data Menu aktif.');
                    }

                    $nominalTagihan = (float) ($row->total_penjualan ?? 0);
                    $waktuBayar = $row->waktu_bayar ?? $row->waktu_order ?? now();
                    $metodeBayar = $this->resolvePaymentMethodCode((string) ($row->metode_pembayaran ?? ''), $methodMap);

                    $pesanan = PesananMasukEntity::query()->create([
                        'data_meja_id' => null,
                        'user_id' => $userId,
                        'kode' => $this->generateImportOrderCode((int) $row->id),
                        'nama_pelanggan' => trim((string) ($row->nama_order ?? 'Majoo Import')),
                        'status' => 'paid',
                        'subtotal' => $nominalTagihan,
                        'diskon' => 0,
                        'pajak' => 0,
                        'service_charge' => 0,
                        'total' => $nominalTagihan,
                        'catatan' => 'Sinkron otomatis dari Import Penjualan batch ' . $row->import_batch_code,
                        'waktu_pesan' => $row->waktu_order ?? $waktuBayar,
                        'waktu_bayar' => $waktuBayar,
                    ]);

                    foreach ($items as $item) {
                        PesananMasukItemEntity::query()->create([
                            'pesanan_id' => $pesanan->id,
                            'data_menu_id' => (int) $item['data_menu_id'],
                            'nama_menu' => (string) $item['nama_menu'],
                            'harga_satuan' => (float) $item['harga_satuan'],
                            'qty' => (int) $item['qty'],
                            'subtotal' => (float) $item['subtotal'],
                            'catatan' => 'Sumber: Import Penjualan',
                        ]);
                    }

                    $payment = PembayaranEntity::query()->create([
                        'pesanan_id' => $pesanan->id,
                        'shift_id' => null,
                        'user_id' => $userId,
                        'kode' => $this->generateImportPaymentCode((int) $row->id),
                        'external_sync_key' => $externalSyncKey,
                        'source_channel' => 'import_penjualan',
                        'metode_bayar' => $metodeBayar,
                        'payment_details' => [],
                        'nominal_tagihan' => $nominalTagihan,
                        'nominal_dibayar' => $nominalTagihan,
                        'kembalian' => 0,
                        'status' => 'paid',
                        'catatan' => 'Sinkron otomatis dari Import Penjualan batch ' . $row->import_batch_code,
                        'waktu_bayar' => $waktuBayar,
                    ]);

                    $row->update([
                        'sync_status' => self::SYNC_STATUS_SYNCED,
                        'synced_at' => now(),
                        'sync_error' => null,
                        'pos_pesanan_id' => $pesanan->id,
                        'pos_pembayaran_id' => $payment->id,
                    ]);
                });

                $syncedCount++;
            } catch (\Throwable $exception) {
                $failedCount++;

                $row->update([
                    'sync_status' => self::SYNC_STATUS_FAILED,
                    'synced_at' => null,
                    'sync_error' => Str::limit($exception->getMessage(), 1000),
                ]);
            }
        }

        return [
            'batch_code' => $batchCode,
            'total_rows' => $rows->count(),
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'skipped_count' => $skippedCount,
        ];
    }

    public function syncAllPendingBatches(?int $userId = null, int $maxBatches = 30): array
    {
        $batchCodes = ImportPenjualanEntity::query()
            ->select('import_batch_code')
            ->where(function ($query) {
                $query
                    ->whereNull('sync_status')
                    ->orWhereIn('sync_status', [self::SYNC_STATUS_PENDING, self::SYNC_STATUS_FAILED]);
            })
            ->groupBy('import_batch_code')
            ->orderByRaw('MAX(created_at) DESC')
            ->limit(max(1, min($maxBatches, 100)))
            ->pluck('import_batch_code')
            ->filter()
            ->values()
            ->all();

        $summary = [
            'total_batches' => count($batchCodes),
            'total_rows' => 0,
            'synced_count' => 0,
            'failed_count' => 0,
            'skipped_count' => 0,
            'batch_results' => [],
        ];

        foreach ($batchCodes as $batchCode) {
            $result = $this->syncBatchToPos((string) $batchCode, $userId, false);

            $summary['total_rows'] += (int) ($result['total_rows'] ?? 0);
            $summary['synced_count'] += (int) ($result['synced_count'] ?? 0);
            $summary['failed_count'] += (int) ($result['failed_count'] ?? 0);
            $summary['skipped_count'] += (int) ($result['skipped_count'] ?? 0);
            $summary['batch_results'][] = $result;
        }

        return $summary;
    }

    public function failedSyncRows(string $batchCode = '', int $limit = 50): array
    {
        $query = ImportPenjualanEntity::query()
            ->where('sync_status', self::SYNC_STATUS_FAILED)
            ->orderByDesc('id')
            ->limit(max(1, min($limit, 300)));

        if (trim($batchCode) !== '') {
            $query->where('import_batch_code', $batchCode);
        }

        return $query
            ->get(['id', 'import_batch_code', 'row_number', 'no_transaksi', 'produk', 'sync_error', 'updated_at'])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'import_batch_code' => (string) $row->import_batch_code,
                'row_number' => (int) ($row->row_number ?? 0),
                'no_transaksi' => (string) ($row->no_transaksi ?? ''),
                'produk' => (string) ($row->produk ?? ''),
                'sync_error' => (string) ($row->sync_error ?? ''),
                'updated_at' => optional($row->updated_at)?->toDateTimeString(),
            ])
            ->values()
            ->all();
    }

    public function deleteBatch(string $batchCode): int
    {
        if (trim($batchCode) === '') {
            return 0;
        }

        $items = ImportPenjualanEntity::query()
            ->where('import_batch_code', $batchCode)
            ->get();

        foreach ($items as $item) {
            $item->delete();
        }

        return $items->count();
    }

    public function buildHppAnalysis(string $batchCode = '', float $minOmzetLowMargin = 0): array
    {
        $rows = ImportPenjualanEntity::query()
            ->when($batchCode !== '', fn ($query) => $query->where('import_batch_code', $batchCode))
            ->get(['produk', 'total_penjualan', 'tanggal_transaksi']);

        if ($rows->isEmpty()) {
            return [
                'summary' => [
                    'total_produk_terdeteksi' => 0,
                    'total_qty_estimasi' => 0,
                    'total_omzet_estimasi' => 0,
                    'total_hpp_estimasi' => 0,
                    'total_margin_estimasi' => 0,
                    'mapped_count' => 0,
                    'unmapped_count' => 0,
                ],
                'items' => [],
                'top_low_margin' => [],
                'warnings' => [
                    'missing_mapping' => [],
                    'missing_bom' => [],
                ],
                'daily_recap' => [],
            ];
        }

        $aggregates = [];
        $lineItems = [];

        foreach ($rows as $row) {
            $tokens = $this->extractProductTokens((string) ($row->produk ?? ''));
            if (empty($tokens)) {
                continue;
            }

            $shareOmzet = (float) $row->total_penjualan / max(1, count($tokens));
            $tanggal = $row->tanggal_transaksi ? Carbon::parse((string) $row->tanggal_transaksi)->format('Y-m-d') : null;

            foreach ($tokens as $token) {
                $key = $this->normalizeProductName($token);
                if ($key === '') {
                    continue;
                }

                if (!isset($aggregates[$key])) {
                    $aggregates[$key] = [
                        'nama_produk' => $token,
                        'qty_terjual' => 0,
                        'omzet_estimasi' => 0,
                    ];
                }

                $aggregates[$key]['qty_terjual'] += 1;
                $aggregates[$key]['omzet_estimasi'] += $shareOmzet;

                $lineItems[] = [
                    'normalized_key' => $key,
                    'nama_produk' => $token,
                    'tanggal' => $tanggal,
                    'omzet_share' => $shareOmzet,
                ];
            }
        }

        $menuMap = $this->buildMenuMap();
        $hppByMenuId = $this->buildHppPerMenuMap();

        $itemsWithKey = collect($aggregates)
            ->map(function (array $item, string $normalizedName) use ($menuMap, $hppByMenuId) {
                $menu = $this->resolveMenuForProduct($normalizedName, $menuMap);

                $qty = (int) $item['qty_terjual'];
                $omzet = (float) $item['omzet_estimasi'];

                $hppPerPorsi = $menu ? (float) ($hppByMenuId[$menu['id']] ?? 0) : 0;
                $hasBom = $menu ? array_key_exists((int) $menu['id'], $hppByMenuId) : false;
                $totalHpp = $hppPerPorsi * $qty;
                $margin = $omzet - $totalHpp;
                $marginPct = $omzet > 0 ? ($margin / $omzet) * 100 : 0;

                return [
                    'normalized_key' => $normalizedName,
                    'nama_produk' => $item['nama_produk'],
                    'menu_id_terpetakan' => $menu['id'] ?? null,
                    'nama_menu_terpetakan' => $menu['nama'] ?? null,
                    'qty_terjual' => $qty,
                    'omzet_estimasi' => round($omzet, 2),
                    'hpp_per_porsi_estimasi' => round($hppPerPorsi, 2),
                    'total_hpp_estimasi' => round($totalHpp, 2),
                    'margin_estimasi' => round($margin, 2),
                    'margin_persen_estimasi' => round($marginPct, 2),
                    'mapped' => $menu !== null,
                    'has_bom' => $hasBom,
                ];
            })
            ->sortByDesc('omzet_estimasi')
            ->values();

        $itemsMap = $itemsWithKey->keyBy('normalized_key');

        $daily = [];
        foreach ($lineItems as $line) {
            $tanggal = $line['tanggal'] ?? 'Tanpa Tanggal';
            $item = $itemsMap->get($line['normalized_key']);

            if (!isset($daily[$tanggal])) {
                $daily[$tanggal] = [
                    'tanggal' => $tanggal,
                    'qty' => 0,
                    'omzet' => 0,
                    'hpp' => 0,
                    'margin' => 0,
                ];
            }

            $omzet = (float) ($line['omzet_share'] ?? 0);
            $hppPerPorsi = (float) ($item['hpp_per_porsi_estimasi'] ?? 0);

            $daily[$tanggal]['qty'] += 1;
            $daily[$tanggal]['omzet'] += $omzet;
            $daily[$tanggal]['hpp'] += $hppPerPorsi;
            $daily[$tanggal]['margin'] += ($omzet - $hppPerPorsi);
        }

        $dailyRecap = collect($daily)
            ->map(function ($row) {
                $marginPct = $row['omzet'] > 0 ? ($row['margin'] / $row['omzet']) * 100 : 0;

                return [
                    'tanggal' => $row['tanggal'],
                    'qty' => (int) $row['qty'],
                    'omzet' => round((float) $row['omzet'], 2),
                    'hpp' => round((float) $row['hpp'], 2),
                    'margin' => round((float) $row['margin'], 2),
                    'margin_persen' => round((float) $marginPct, 2),
                ];
            })
            ->sortBy('tanggal')
            ->values();

        $items = $itemsWithKey->map(function ($item) {
            unset($item['normalized_key']);
            return $item;
        })->values();

        $mappedCount = (int) $items->where('mapped', true)->count();
        $unmappedCount = (int) $items->where('mapped', false)->count();

        $topLowMargin = $items
            ->filter(fn ($item) => (bool) ($item['mapped'] ?? false))
            ->filter(fn ($item) => (float) ($item['omzet_estimasi'] ?? 0) >= max(0, $minOmzetLowMargin))
            ->sortBy('margin_persen_estimasi')
            ->take(10)
            ->values()
            ->all();

        $warningMissingMapping = $items
            ->filter(fn ($item) => !($item['mapped'] ?? false))
            ->map(function ($item) {
                $item['warning_priority_score'] = round((float) ($item['omzet_estimasi'] ?? 0), 2);
                return $item;
            })
            ->sortByDesc('warning_priority_score')
            ->take(30)
            ->values()
            ->all();

        $warningMissingBom = $items
            ->filter(fn ($item) => ($item['mapped'] ?? false) && !($item['has_bom'] ?? false))
            ->map(function ($item) {
                $item['warning_priority_score'] = round((float) ($item['omzet_estimasi'] ?? 0), 2);
                return $item;
            })
            ->sortByDesc('warning_priority_score')
            ->take(30)
            ->values()
            ->all();

        return [
            'summary' => [
                'total_produk_terdeteksi' => (int) $items->count(),
                'total_qty_estimasi' => (int) $items->sum('qty_terjual'),
                'total_omzet_estimasi' => (float) $items->sum('omzet_estimasi'),
                'total_hpp_estimasi' => (float) $items->sum('total_hpp_estimasi'),
                'total_margin_estimasi' => (float) $items->sum('margin_estimasi'),
                'mapped_count' => $mappedCount,
                'unmapped_count' => $unmappedCount,
            ],
            'items' => $items->take(200)->all(),
            'top_low_margin' => $topLowMargin,
            'warnings' => [
                'missing_mapping' => $warningMissingMapping,
                'missing_bom' => $warningMissingBom,
            ],
            'daily_recap' => $dailyRecap->all(),
        ];
    }

    private function readRows(UploadedFile $file, string $extension): array
    {
        if (in_array($extension, ['csv', 'txt'], true)) {
            $handle = fopen($file->getRealPath(), 'rb');
            if (!$handle) {
                return [];
            }

            $result = [];
            while (($row = fgetcsv($handle, 0, ',')) !== false) {
                $result[] = array_map(fn ($item) => trim((string) $item), $row);
            }
            fclose($handle);

            return $result;
        }

        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();

        return collect($sheet->toArray(null, false, false, false))
            ->map(fn ($row) => array_map(fn ($item) => trim((string) $item), $row))
            ->values()
            ->all();
    }

    private function extractDataRows(array $rows): array
    {
        $headerIndex = null;
        $headerMap = [];

        foreach ($rows as $rowIndex => $row) {
            $normalized = array_map(fn ($value) => $this->normalizeHeader($value), $row);
            $candidateMap = $this->buildHeaderMap($normalized);

            if (count($candidateMap) >= 6 && isset($candidateMap['no_transaksi']) && isset($candidateMap['total_penjualan'])) {
                $headerIndex = $rowIndex;
                $headerMap = $candidateMap;
                break;
            }
        }

        if ($headerIndex === null) {
            throw new \RuntimeException('Header file tidak dikenali. Pastikan kolom No Transaksi dan Total Penjualan tersedia.');
        }

        $dataRows = array_slice($rows, $headerIndex + 1);

        return [$headerMap, $dataRows];
    }

    private function buildHeaderMap(array $normalizedHeaders): array
    {
        $result = [];

        foreach ($normalizedHeaders as $index => $header) {
            if ($header === '') {
                continue;
            }

            foreach (self::COLUMN_ALIASES as $key => $aliases) {
                if (in_array($header, $aliases, true)) {
                    $result[$key] = $index;
                    break;
                }
            }
        }

        return $result;
    }

    private function cellValue(array $row, array $headerMap, string $key): string
    {
        if (!isset($headerMap[$key])) {
            return '';
        }

        $index = $headerMap[$key];

        return trim((string) ($row[$index] ?? ''));
    }

    private function normalizeHeader(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->replace(['\n', "\r", "\t"], ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    private function parseDateTime(string $value): ?Carbon
    {
        if (trim($value) === '') {
            return null;
        }

        $formats = ['d-m-Y H:i:s', 'd/m/Y H:i:s', 'Y-m-d H:i:s', 'd-m-Y H:i', 'd/m/Y H:i'];

        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $value);
            } catch (\Throwable) {
            }
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function parseMoney(string $value): float
    {
        $raw = trim($value);
        if ($raw === '') {
            return 0;
        }

        $clean = preg_replace('/[^0-9,.-]/', '', $raw) ?? '';
        if ($clean === '' || $clean === '-' || $clean === '.' || $clean === ',') {
            return 0;
        }

        $hasComma = str_contains($clean, ',');
        $hasDot = str_contains($clean, '.');

        if ($hasComma && $hasDot) {
            $lastComma = strrpos($clean, ',');
            $lastDot = strrpos($clean, '.');

            if ($lastComma !== false && $lastDot !== false && $lastComma > $lastDot) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{1,2}$/', $clean) === 1) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot && preg_match('/\.\d{3}(\.\d{3})+$/', $clean) === 1) {
            $clean = str_replace('.', '', $clean);
        }

        return round((float) $clean, 2);
    }

    private function extractProductTokens(string $value): array
    {
        if (trim($value) === '') {
            return [];
        }

        return collect(explode(',', $value))
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();
    }

    private function normalizeProductName(string $name): string
    {
        return Str::of($name)
            ->lower()
            ->replaceMatches('/[^a-z0-9\s]/', ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->value();
    }

    private function buildMenuMap(): Collection
    {
        return DataMenuEntity::query()
            ->where('is_active', true)
            ->get(['id', 'nama'])
            ->map(function ($menu) {
                $normalized = $this->normalizeProductName((string) $menu->nama);

                return [
                    'id' => (int) $menu->id,
                    'nama' => (string) $menu->nama,
                    'normalized' => $normalized,
                ];
            })
            ->filter(fn ($item) => $item['normalized'] !== '')
            ->values();
    }

    private function buildHppPerMenuMap(): array
    {
        $hargaBahan = BahanBakuEntity::query()
            ->where('is_active', true)
            ->pluck('harga_beli_terakhir', 'id')
            ->map(fn ($value) => (float) $value)
            ->all();

        $map = [];

        $bomItems = ResepBOMEntity::query()
            ->where('is_active', true)
            ->get(['data_menu_id', 'bahan_baku_id', 'qty_kebutuhan', 'referensi_porsi']);

        foreach ($bomItems as $bom) {
            $menuId = (int) $bom->data_menu_id;
            $bahanId = (int) $bom->bahan_baku_id;
            $harga = (float) ($hargaBahan[$bahanId] ?? 0);

            $qtyKebutuhan = (float) $bom->qty_kebutuhan;
            $referensiPorsi = max(0.001, (float) $bom->referensi_porsi);
            $pemakaianPerPorsi = $qtyKebutuhan / $referensiPorsi;

            $map[$menuId] = ($map[$menuId] ?? 0) + ($pemakaianPerPorsi * $harga);
        }

        return $map;
    }

    private function resolveMenuForProduct(string $normalizedProduct, Collection $menuMap): ?array
    {
        if ($normalizedProduct === '') {
            return null;
        }

        $exact = $menuMap->first(fn ($menu) => $menu['normalized'] === $normalizedProduct);
        if ($exact) {
            return $exact;
        }

        $contains = $menuMap->first(function ($menu) use ($normalizedProduct) {
            return str_contains($normalizedProduct, $menu['normalized']) || str_contains($menu['normalized'], $normalizedProduct);
        });

        return $contains ?: null;
    }

    private function buildPosItemsForImportRow(ImportPenjualanEntity $row, Collection $menuMap): array
    {
        $tokens = $this->extractProductTokens((string) ($row->produk ?? ''));

        $mappedMenus = collect($tokens)
            ->map(function (string $token) use ($menuMap) {
                $normalized = $this->normalizeProductName($token);
                if ($normalized === '') {
                    return null;
                }

                return $this->resolveMenuForProduct($normalized, $menuMap);
            })
            ->filter()
            ->values();

        if ($mappedMenus->isEmpty()) {
            return [];
        }

        $qtyTotal = max(1, $mappedMenus->count());
        $nominalTotal = (float) ($row->total_penjualan ?? 0);
        $hargaSatuan = $qtyTotal > 0 ? ($nominalTotal / $qtyTotal) : 0;

        return $mappedMenus
            ->groupBy('id')
            ->map(function (Collection $group) use ($hargaSatuan) {
                $menu = $group->first();
                $qty = max(1, $group->count());

                return [
                    'data_menu_id' => (int) $menu['id'],
                    'nama_menu' => (string) $menu['nama'],
                    'qty' => $qty,
                    'harga_satuan' => round($hargaSatuan, 2),
                    'subtotal' => round($qty * $hargaSatuan, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function buildPaymentMethodMap(): array
    {
        $methods = MetodePembayaranEntity::query()
            ->where('is_active', true)
            ->get(['kode', 'nama'])
            ->map(function ($item) {
                return [
                    'kode' => (string) $item->kode,
                    'nama_normalized' => $this->normalizeProductName((string) $item->nama),
                ];
            })
            ->values();

        $defaultCode = (string) (MetodePembayaranEntity::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('urutan')
            ->value('kode') ?? 'cash');

        return [
            'default_code' => $defaultCode,
            'methods' => $methods,
        ];
    }

    private function resolvePaymentMethodCode(string $rawMethod, array $methodMap): string
    {
        $normalized = $this->normalizeProductName($rawMethod);
        $methods = collect($methodMap['methods'] ?? []);

        if ($normalized !== '') {
            $exact = $methods->first(fn ($item) => ($item['nama_normalized'] ?? '') === $normalized);
            if ($exact) {
                return (string) $exact['kode'];
            }

            $contains = $methods->first(function ($item) use ($normalized) {
                $name = (string) ($item['nama_normalized'] ?? '');
                return $name !== '' && (str_contains($name, $normalized) || str_contains($normalized, $name));
            });

            if ($contains) {
                return (string) $contains['kode'];
            }
        }

        return (string) ($methodMap['default_code'] ?? 'cash');
    }

    private function generateImportOrderCode(int $importRowId): string
    {
        return 'IMP-ORD-' . $importRowId;
    }

    private function generateImportPaymentCode(int $importRowId): string
    {
        return 'IMP-PAY-' . $importRowId;
    }
}
