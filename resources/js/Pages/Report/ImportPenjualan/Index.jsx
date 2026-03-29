import { Head, router, useForm } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

function formatIDR(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export default function Index({ imports, batches, hppAnalysis, failedSyncRows, filters, flashMessage }) {
    const endpoint = "/report/import-penjualan";
    const searchValue = filters?.search ?? "";
    const batchFilter = filters?.batch_code ?? "";
    const minOmzetLowMargin = Number(filters?.min_omzet_low_margin ?? 0);

    const { setData, post, processing, reset } = useForm({
        mode: "import",
        file: null,
    });

    const hasData = (imports?.data ?? []).length > 0;
    const hppSummary = hppAnalysis?.summary ?? {
        total_produk_terdeteksi: 0,
        total_qty_estimasi: 0,
        total_omzet_estimasi: 0,
        total_hpp_estimasi: 0,
        total_margin_estimasi: 0,
        mapped_count: 0,
        unmapped_count: 0,
    };
    const hppItems = hppAnalysis?.items ?? [];
    const lowMarginItems = hppAnalysis?.top_low_margin ?? [];
    const warningMissingMapping = hppAnalysis?.warnings?.missing_mapping ?? [];
    const warningMissingBom = hppAnalysis?.warnings?.missing_bom ?? [];
    const dailyRecap = hppAnalysis?.daily_recap ?? [];
    const failedRows = failedSyncRows ?? [];

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();

        router.get(
            endpoint,
            {
                search,
                batch_code: batchFilter || undefined,
                min_omzet_low_margin: minOmzetLowMargin > 0 ? minOmzetLowMargin : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const goPage = (page) => {
        router.get(
            endpoint,
            {
                search: searchValue,
                batch_code: batchFilter || undefined,
                min_omzet_low_margin: minOmzetLowMargin > 0 ? minOmzetLowMargin : undefined,
                page,
            },
            { preserveState: true }
        );
    };

    const submitImport = (event) => {
        event.preventDefault();

        post(endpoint, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => reset("file"),
        });
    };

    const openBatch = (batchCode) => {
        router.get(
            endpoint,
            {
                search: searchValue || undefined,
                batch_code: batchCode || undefined,
                min_omzet_low_margin: minOmzetLowMargin > 0 ? minOmzetLowMargin : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const clearBatchFilter = () => {
        router.get(
            endpoint,
            {
                search: searchValue || undefined,
                min_omzet_low_margin: minOmzetLowMargin > 0 ? minOmzetLowMargin : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const submitLowMarginFilter = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const minimumOmzet = Number(formData.get("min_omzet_low_margin") || 0);

        router.get(
            endpoint,
            {
                search: searchValue || undefined,
                batch_code: batchFilter || undefined,
                min_omzet_low_margin: minimumOmzet > 0 ? minimumOmzet : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const removeBatch = (batchCode) => {
        if (!window.confirm(`Hapus semua data batch ${batchCode}?`)) return;

        router.post(
            endpoint,
            { mode: "delete_batch", batch_code: batchCode },
            { preserveScroll: true }
        );
    };

    const syncBatchToPos = (batchCode, onlyFailed = false) => {
        const message = onlyFailed
            ? `Sinkron ulang hanya data FAILED dari batch ${batchCode}?`
            : `Sinkronkan batch ${batchCode} ke transaksi POS utama?`;
        if (!window.confirm(message)) return;

        router.post(
            endpoint,
            {
                mode: "sync_batch",
                batch_code: batchCode,
                only_failed: onlyFailed,
            },
            { preserveScroll: true }
        );
    };

    const syncAllPendingBatches = () => {
        if (!window.confirm("Sinkronkan semua batch yang masih pending/failed ke POS utama?")) return;

        router.post(
            endpoint,
            {
                mode: "sync_all_pending",
            },
            { preserveScroll: true }
        );
    };

    return (
        <DashboardLayout title="Import Penjualan">
            <Head title="Import Penjualan" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Report Integration</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Import Penjualan</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Upload file laporan penjualan (XLSX/XLS/CSV). Sistem akan membaca kolom transaksi seperti No Transaksi, Waktu Order, Waktu Bayar, Produk, dan Total Penjualan.
                    </p>

                    <form className="mt-4 flex flex-col gap-3 md:flex-row md:items-end" onSubmit={submitImport}>
                        <div className="w-full md:max-w-lg">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">File Laporan Penjualan</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv,.txt"
                                onChange={(event) => setData("file", event.target.files?.[0] || null)}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={processing}>{processing ? "Import..." : "Upload & Import"}</Button>
                    </form>

                    <div className="mt-4 rounded-2xl border bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">Tips file:</p>
                        <ul className="mt-1 list-disc pl-5">
                            <li>Gunakan file detail transaksi penjualan.</li>
                            <li>Header kolom harus standar (No Transaksi, Waktu Order, Total Penjualan, dll).</li>
                            <li>Baris kosong di tengah file otomatis dilewati.</li>
                        </ul>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Riwayat Batch Import</h2>
                        <Button type="button" size="sm" onClick={syncAllPendingBatches}>Sinkron Semua Pending</Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {(batches ?? []).length > 0 ? (
                            batches.map((item) => (
                                <div key={item.import_batch_code} className="rounded-xl border p-3">
                                    <p className="text-xs text-slate-500">Batch</p>
                                    <p className="font-mono text-sm font-semibold text-slate-900">{item.import_batch_code}</p>
                                    <p className="mt-1 text-xs text-slate-600">Rows: {item.total_rows} | Total: {formatIDR(item.total_penjualan)}</p>
                                    <p className="mt-1 text-xs text-slate-600">Synced: {item.synced_rows || 0} | Pending: {item.pending_rows || 0} | Failed: {item.failed_rows || 0}</p>
                                    <div className="mt-2 flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => openBatch(item.import_batch_code)}>Lihat</Button>
                                        <Button type="button" size="sm" onClick={() => syncBatchToPos(item.import_batch_code)}>Sinkron ke POS</Button>
                                        <Button type="button" size="sm" variant="secondary" onClick={() => syncBatchToPos(item.import_batch_code, true)}>Sinkron Ulang Failed</Button>
                                        <Button type="button" size="sm" variant="destructive" onClick={() => removeBatch(item.import_batch_code)}>Hapus Batch</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Belum ada batch import.</p>
                        )}
                    </div>
                </section>

                {failedRows.length > 0 ? (
                    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 shadow-sm md:p-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-700">Diagnostik Gagal Sinkron</h2>
                        <p className="mt-1 text-xs text-rose-700">Daftar ini menampilkan error aktual per row agar tim bisa cepat perbaiki mapping/menu/metode bayar.</p>
                        <div className="mt-3 w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Batch</TableHead>
                                        <TableHead>Row</TableHead>
                                        <TableHead>No Transaksi</TableHead>
                                        <TableHead>Produk</TableHead>
                                        <TableHead>Error</TableHead>
                                        <TableHead>Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {failedRows.map((row) => (
                                        <TableRow key={`failed-${row.id}`}>
                                            <TableCell className="font-mono text-xs">{row.import_batch_code}</TableCell>
                                            <TableCell>{row.row_number || "-"}</TableCell>
                                            <TableCell>{row.no_transaksi || "-"}</TableCell>
                                            <TableCell className="max-w-80 truncate">{row.produk || "-"}</TableCell>
                                            <TableCell className="max-w-lg whitespace-normal text-xs text-rose-800">{row.sync_error || "-"}</TableCell>
                                            <TableCell className="text-xs text-slate-600">{row.updated_at || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                ) : null}

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Analisa HPP Estimasi (Berdasarkan Resep BOM)</h2>

                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Produk Terdeteksi</p>
                            <p className="text-lg font-semibold">{hppSummary.total_produk_terdeteksi}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Qty Estimasi</p>
                            <p className="text-lg font-semibold">{hppSummary.total_qty_estimasi}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Omzet Estimasi</p>
                            <p className="text-lg font-semibold">{formatIDR(hppSummary.total_omzet_estimasi)}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Total HPP Estimasi</p>
                            <p className="text-lg font-semibold">{formatIDR(hppSummary.total_hpp_estimasi)}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Margin Estimasi</p>
                            <p className="text-lg font-semibold">{formatIDR(hppSummary.total_margin_estimasi)}</p>
                        </div>
                        <div className="rounded-xl border p-3">
                            <p className="text-xs text-slate-500">Mapping Menu</p>
                            <p className="text-lg font-semibold">{hppSummary.mapped_count} cocok / {hppSummary.unmapped_count} belum cocok</p>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        Catatan: ini analisa estimasi. Jika satu kolom produk berisi banyak item, omzet dibagi rata per item untuk perhitungan awal.
                    </p>

                    <div className="mt-4 w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk Dari File</TableHead>
                                    <TableHead>Menu Terpetakan</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Omzet</TableHead>
                                    <TableHead className="text-right">HPP/Porsi</TableHead>
                                    <TableHead className="text-right">Total HPP</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                    <TableHead className="text-right">Margin %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hppItems.length > 0 ? (
                                    hppItems.map((item, index) => (
                                        <TableRow key={`${item.nama_produk}-${index}`}>
                                            <TableCell className="font-medium">{item.nama_produk}</TableCell>
                                            <TableCell>{item.nama_menu_terpetakan || <span className="text-rose-600">Belum terpetakan</span>}</TableCell>
                                            <TableCell className="text-right">{item.qty_terjual}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.omzet_estimasi)}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.hpp_per_porsi_estimasi)}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.total_hpp_estimasi)}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.margin_estimasi)}</TableCell>
                                            <TableCell className="text-right">{Number(item.margin_persen_estimasi || 0).toFixed(2)}%</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada data untuk analisa HPP.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border p-4">
                            <h3 className="text-sm font-semibold text-slate-800">Top Margin Terendah (Prioritas Cek Harga)</h3>
                            <p className="mt-1 text-xs text-slate-500">Diurutkan dari margin persen paling rendah berdasarkan estimasi batch aktif.</p>
                            <form onSubmit={submitLowMarginFilter} className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
                                <div className="w-full md:max-w-xs">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Minimum Omzet Untuk Ranking</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="min_omzet_low_margin"
                                        defaultValue={minOmzetLowMargin}
                                        className="h-9 w-full rounded-lg border px-3 text-sm"
                                        placeholder="Contoh: 100000"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" variant="outline">Terapkan</Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            router.get(
                                                endpoint,
                                                {
                                                    search: searchValue || undefined,
                                                    batch_code: batchFilter || undefined,
                                                },
                                                { preserveState: true, replace: true }
                                            )
                                        }
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-3 w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead className="text-right">Omzet</TableHead>
                                            <TableHead className="text-right">Margin</TableHead>
                                            <TableHead className="text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowMarginItems.length > 0 ? (
                                            lowMarginItems.map((item, index) => (
                                                <TableRow key={`low-margin-${item.nama_produk}-${index}`}>
                                                    <TableCell className="font-medium">{item.nama_produk}</TableCell>
                                                    <TableCell className="text-right">{formatIDR(item.omzet_estimasi)}</TableCell>
                                                    <TableCell className="text-right">{formatIDR(item.margin_estimasi)}</TableCell>
                                                    <TableCell className="text-right">{Number(item.margin_persen_estimasi || 0).toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                                                    Belum ada data margin rendah.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="rounded-2xl border p-4">
                            <h3 className="text-sm font-semibold text-slate-800">Warning Data Mapping & BOM</h3>
                            <p className="mt-1 text-xs text-slate-500">Fokuskan pembenahan master menu dan resep BOM di item berikut.</p>
                            <div className="mt-3 space-y-3">
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Belum Terpetakan ke Menu ({warningMissingMapping.length})</p>
                                    <div className="mt-2 text-xs text-amber-900">
                                        {warningMissingMapping.length > 0 ? warningMissingMapping.map((item, index) => (
                                            <p key={`warn-map-${item.nama_produk}-${index}`}>{item.nama_produk} • Qty {item.qty_terjual} • Omzet {formatIDR(item.warning_priority_score)}</p>
                                        )) : <p>Tidak ada.</p>}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Menu Sudah Match Tapi BOM Belum Lengkap ({warningMissingBom.length})</p>
                                    <div className="mt-2 text-xs text-rose-900">
                                        {warningMissingBom.length > 0 ? warningMissingBom.map((item, index) => (
                                            <p key={`warn-bom-${item.nama_produk}-${index}`}>{item.nama_produk} - {item.nama_menu_terpetakan} • Qty {item.qty_terjual} • Omzet {formatIDR(item.warning_priority_score)}</p>
                                        )) : <p>Tidak ada.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border p-4">
                        <h3 className="text-sm font-semibold text-slate-800">Rekap Harian Omzet vs HPP</h3>
                        <p className="mt-1 text-xs text-slate-500">Gunakan tabel ini untuk evaluasi performa harian dan pergeseran margin.</p>
                        <div className="mt-3 w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Omzet</TableHead>
                                        <TableHead className="text-right">HPP</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                        <TableHead className="text-right">Margin %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyRecap.length > 0 ? (
                                        dailyRecap.map((row) => (
                                            <TableRow key={`daily-${row.tanggal}`}>
                                                <TableCell className="font-medium">{row.tanggal}</TableCell>
                                                <TableCell className="text-right">{row.qty}</TableCell>
                                                <TableCell className="text-right">{formatIDR(row.omzet)}</TableCell>
                                                <TableCell className="text-right">{formatIDR(row.hpp)}</TableCell>
                                                <TableCell className="text-right">{formatIDR(row.margin)}</TableCell>
                                                <TableCell className="text-right">{Number(row.margin_persen || 0).toFixed(2)}%</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                                Belum ada data rekap harian.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari no transaksi, produk, outlet, batch"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.error ?? flashMessage?.success}
                        flashType={flashMessage?.error ? "error" : "success"}
                    />

                    {batchFilter ? (
                        <div className="mb-3 flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-cyan-100 px-2 py-1 font-semibold text-cyan-800">Filter batch: {batchFilter}</span>
                            <Button type="button" variant="outline" size="sm" onClick={clearBatchFilter}>Reset Filter</Button>
                        </div>
                    ) : null}

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>No Transaksi</TableHead>
                                    <TableHead>Waktu Bayar</TableHead>
                                    <TableHead>Outlet</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Status Sync</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    imports.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs">{item.import_batch_code}</TableCell>
                                            <TableCell>{item.no_transaksi || "-"}</TableCell>
                                            <TableCell>{item.waktu_bayar || item.waktu_order || "-"}</TableCell>
                                            <TableCell>{item.outlet || "-"}</TableCell>
                                            <TableCell className="max-w-80 truncate">{item.produk || "-"}</TableCell>
                                            <TableCell>
                                                {item.sync_status === "synced" ? (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Synced</span>
                                                ) : item.sync_status === "failed" ? (
                                                    <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700" title={item.sync_error || "Sinkron gagal"}>Failed</span>
                                                ) : (
                                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Pending</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.metode_pembayaran || "-"}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatIDR(item.total_penjualan)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Belum ada data import.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationSelect
                        currentPage={imports?.meta?.current_page ?? 1}
                        lastPage={imports?.meta?.last_page ?? 1}
                        total={imports?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
