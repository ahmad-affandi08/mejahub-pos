import { Head, router } from "@inertiajs/react";

import { formatIDR } from "@/components/shared/pos/format";
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

function directionLabel(direction) {
    const map = {
        in: "Masuk",
        out: "Keluar",
        transfer: "Transfer",
        transfer_reversal: "Reversal Transfer",
        adjustment_in: "Adjust +",
        adjustment_out: "Adjust -",
    };

    return map[direction] ?? direction ?? "-";
}

export default function Index({ report, filters }) {
    const endpoint = "/report/laporan-stok";
    const searchValue = filters?.search ?? "";
    const lowStockOnly = Boolean(filters?.low_stock_only);

    const summary = report?.summary ?? {};
    const lowStocks = report?.low_stocks ?? [];
    const mutations = report?.mutations?.data ?? [];
    const mutationMeta = report?.mutations?.meta ?? {};

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();

        router.get(
            endpoint,
            { search, low_stock_only: lowStockOnly ? 1 : 0 },
            { preserveState: true, replace: true },
        );
    };

    const toggleLowStock = () => {
        router.get(
            endpoint,
            {
                search: searchValue,
                low_stock_only: lowStockOnly ? 0 : 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const goPage = (page) => {
        router.get(
            endpoint,
            {
                search: searchValue,
                low_stock_only: lowStockOnly ? 1 : 0,
                page,
            },
            { preserveState: true },
        );
    };

    return (
        <DashboardLayout title="Laporan Stok">
            <Head title="Laporan Stok" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Report</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Stok</h1>
                    <p className="mt-1 text-sm text-slate-600">Ringkasan stok, daftar minimum, dan histori mutasi stok terpadu.</p>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Total Item Aktif</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total_items ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Low Stock</p>
                        <p className="mt-2 text-2xl font-semibold text-amber-600">{summary.low_stock_items ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Out of Stock</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-600">{summary.out_of_stock_items ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Nilai Persediaan</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary.total_stock_value ?? 0)}</p>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <form className="flex flex-1 gap-2" onSubmit={submitSearch}>
                            <input
                                type="text"
                                name="search"
                                defaultValue={searchValue}
                                placeholder="Cari bahan, referensi mutasi, atau tipe mutasi"
                                className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                            />
                            <Button type="submit">Cari</Button>
                        </form>
                        <Button type="button" variant={lowStockOnly ? "default" : "outline"} onClick={toggleLowStock}>
                            {lowStockOnly ? "Tampilkan Semua" : "Hanya Low Stock"}
                        </Button>
                    </div>

                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Daftar Bahan</h2>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Stok</TableHead>
                                    <TableHead>Minimum</TableHead>
                                    <TableHead>Harga Beli</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStocks.length > 0 ? (
                                    lowStocks.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode || "-"}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell>{item.supplier_nama || "-"}</TableCell>
                                            <TableCell>{item.stok_saat_ini} {item.satuan}</TableCell>
                                            <TableCell>{item.stok_minimum} {item.satuan}</TableCell>
                                            <TableCell>{formatIDR(item.harga_beli_terakhir ?? 0)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                            Tidak ada data bahan untuk filter saat ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Histori Mutasi Stok</h2>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Ref</TableHead>
                                    <TableHead>Bahan</TableHead>
                                    <TableHead>Arah</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Stok Sebelum</TableHead>
                                    <TableHead>Stok Sesudah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mutations.length > 0 ? (
                                    mutations.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.occurred_at || item.created_at || "-"}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.reference_code || "-"}</div>
                                                <div className="text-xs text-slate-500">{item.reference_type || "-"}</div>
                                            </TableCell>
                                            <TableCell>{item.bahan_baku_nama || "-"}</TableCell>
                                            <TableCell>{directionLabel(item.direction)}</TableCell>
                                            <TableCell>{item.qty} {item.satuan || ""}</TableCell>
                                            <TableCell>{item.stok_sebelum ?? "-"}</TableCell>
                                            <TableCell>{item.stok_sesudah ?? "-"}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada histori mutasi stok.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Halaman {mutationMeta.current_page ?? 1} dari {mutationMeta.last_page ?? 1} | Total {mutationMeta.total ?? 0} mutasi
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(mutationMeta.current_page ?? 1) <= 1}
                                onClick={() => goPage((mutationMeta.current_page ?? 1) - 1)}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(mutationMeta.current_page ?? 1) >= (mutationMeta.last_page ?? 1)}
                                onClick={() => goPage((mutationMeta.current_page ?? 1) + 1)}
                            >
                                Berikutnya
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
