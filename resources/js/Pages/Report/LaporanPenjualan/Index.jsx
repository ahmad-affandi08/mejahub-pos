import { Head, router } from "@inertiajs/react";
import { useState } from "react";

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

function formatPercent(value) {
    return `${Number(value || 0).toFixed(2)}%`;
}

export default function Index({ report, filters }) {
    const endpoint = "/report/laporan-penjualan";

    const summary = report?.summary ?? {};
    const expenseBreakdown = report?.expense_breakdown ?? [];
    const topItems = report?.top_items ?? [];
    const paymentMethods = report?.payment_methods ?? [];
    const payrollVsRevenue = report?.payroll_vs_revenue ?? {};
    const dailyTrend = report?.daily_trend ?? [];

    const periodType = filters?.period_type ?? "daily";
    const referenceDate = filters?.reference_date ?? "";
    const dateFrom = filters?.date_from ?? "";
    const dateTo = filters?.date_to ?? "";
    const topLimit = filters?.top_limit ?? 10;
    const effectiveRange = filters?.effective_range;

    const [filterState, setFilterState] = useState({
        periodType,
        referenceDate,
        dateFrom,
        dateTo,
        topLimit,
    });

    const submitFilter = (event) => {
        event.preventDefault();
        const nextPeriodType = filterState.periodType || "daily";
        const nextReferenceDate = filterState.referenceDate || "";
        const nextDateFrom = filterState.dateFrom || "";
        const nextDateTo = filterState.dateTo || "";
        const nextTopLimit = Number(filterState.topLimit || 10);

        router.get(
            endpoint,
            {
                period_type: nextPeriodType,
                reference_date: nextReferenceDate || undefined,
                date_from: nextPeriodType === "custom" ? (nextDateFrom || undefined) : undefined,
                date_to: nextPeriodType === "custom" ? (nextDateTo || undefined) : undefined,
                top_limit: nextTopLimit,
            },
            { preserveState: true, replace: true },
        );
    };

    const buildExportUrl = (type) => {
        const params = new URLSearchParams();

        params.set("period_type", filterState.periodType || "daily");
        if (filterState.referenceDate) params.set("reference_date", filterState.referenceDate);
        if (filterState.periodType === "custom") {
            if (filterState.dateFrom) params.set("date_from", filterState.dateFrom);
            if (filterState.dateTo) params.set("date_to", filterState.dateTo);
        }
        params.set("top_limit", String(Number(filterState.topLimit || 10)));
        params.set("export", type);

        return `${endpoint}?${params.toString()}`;
    };

    return (
        <DashboardLayout title="Laporan Penjualan">
            <Head title="Laporan Penjualan" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Report</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Penjualan</h1>
                    <p className="mt-1 text-sm text-slate-600">Monitoring omzet, jumlah transaksi, item terlaris, metode pembayaran, dan rasio payroll terhadap pendapatan.</p>
                    {effectiveRange?.label ? (
                        <p className="mt-2 text-sm font-medium text-slate-700">Periode efektif: {effectiveRange.label}</p>
                    ) : null}
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-3 flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("excel"), "_blank")}>Export Excel</Button>
                        <Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("pdf"), "_blank")}>Export PDF</Button>
                    </div>

                    <form className="grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={submitFilter}>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis Periode</label>
                            <select
                                name="period_type"
                                value={filterState.periodType}
                                onChange={(event) => setFilterState((prev) => ({ ...prev, periodType: event.target.value }))}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                            >
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Acuan</label>
                            <input
                                type="date"
                                name="reference_date"
                                value={filterState.referenceDate}
                                onChange={(event) => setFilterState((prev) => ({ ...prev, referenceDate: event.target.value }))}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dari (Custom)</label>
                            <input
                                type="date"
                                name="date_from"
                                value={filterState.dateFrom}
                                onChange={(event) => setFilterState((prev) => ({ ...prev, dateFrom: event.target.value }))}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sampai (Custom)</label>
                            <input
                                type="date"
                                name="date_to"
                                value={filterState.dateTo}
                                onChange={(event) => setFilterState((prev) => ({ ...prev, dateTo: event.target.value }))}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Item</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="top_limit"
                                    min={3}
                                    max={25}
                                    value={filterState.topLimit}
                                    onChange={(event) => setFilterState((prev) => ({ ...prev, topLimit: event.target.value }))}
                                    className="h-10 w-full rounded-lg border px-3 text-sm"
                                />
                                <Button type="submit">Terapkan</Button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Omzet</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary.omzet ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Jumlah Transaksi</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.jumlah_transaksi ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Rata-rata Transaksi</p>
                        <p className="mt-2 text-2xl font-semibold text-cyan-700">{formatIDR(summary.rata_rata_transaksi ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Payroll Ratio</p>
                        <p className="mt-2 text-2xl font-semibold text-fuchsia-700">{formatPercent(payrollVsRevenue.rasio_persen ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Pengeluaran + Petty Cash</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-700">{formatIDR(summary.total_beban_operasional ?? 0)}</p>
                        <p className="mt-1 text-xs text-slate-500">Pengeluaran: {formatIDR(summary.total_pengeluaran ?? 0)} | Petty: {formatIDR(summary.petty_cash_keluar ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Net Omzet Operasional</p>
                        <p className="mt-2 text-2xl font-semibold text-sky-700">{formatIDR(summary.net_omzet_operasional ?? 0)}</p>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Item Terlaris</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Menu</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Nilai Penjualan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topItems.length > 0 ? (
                                    topItems.map((item, index) => (
                                        <TableRow key={`${item.nama_menu}-${index}`}>
                                            <TableCell className="font-medium">{item.nama_menu}</TableCell>
                                            <TableCell className="text-right">{item.total_qty}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.total_penjualan)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                            Belum ada data item terjual di periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </article>

                    <article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Metode Pembayaran</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Metode</TableHead>
                                    <TableHead className="text-right">Transaksi</TableHead>
                                    <TableHead className="text-right">Nominal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentMethods.length > 0 ? (
                                    paymentMethods.map((item) => (
                                        <TableRow key={item.kode || item.nama}>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell className="text-right">{item.jumlah_transaksi}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.total_nominal)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                            Belum ada transaksi pembayaran pada periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </article>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Breakdown Pengeluaran</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead className="text-right">Nominal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenseBreakdown.length > 0 ? (
                                    expenseBreakdown.map((item, index) => (
                                        <TableRow key={`${item.kategori}-${index}`}>
                                            <TableCell className="font-medium">{item.kategori}</TableCell>
                                            <TableCell className="text-right">{item.jumlah}</TableCell>
                                            <TableCell className="text-right">{formatIDR(item.total_nominal)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                            Belum ada pengeluaran pada periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </article>

                    <article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Payroll vs Pendapatan</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <span>Pendapatan</span>
                                <strong>{formatIDR(payrollVsRevenue.pendapatan ?? 0)}</strong>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <span>Penggajian</span>
                                <strong>{formatIDR(payrollVsRevenue.penggajian ?? 0)}</strong>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <span>Selisih</span>
                                <strong>{formatIDR(payrollVsRevenue.selisih ?? 0)}</strong>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <span>Rasio Payroll</span>
                                <strong>{formatPercent(payrollVsRevenue.rasio_persen ?? 0)}</strong>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Tren Harian</h2>
                        <div className="max-h-80 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Transaksi</TableHead>
                                        <TableHead className="text-right">Omzet</TableHead>
                                        <TableHead className="text-right">Pengeluaran</TableHead>
                                        <TableHead className="text-right">Petty Cash</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyTrend.length > 0 ? (
                                        dailyTrend.map((item) => (
                                            <TableRow key={item.tanggal}>
                                                <TableCell>{item.tanggal}</TableCell>
                                                <TableCell className="text-right">{item.jumlah_transaksi}</TableCell>
                                                <TableCell className="text-right">{formatIDR(item.omzet)}</TableCell>
                                                <TableCell className="text-right">{formatIDR(item.pengeluaran)}</TableCell>
                                                <TableCell className="text-right">{formatIDR(item.petty_cash_keluar)}</TableCell>
                                                <TableCell className="text-right">{formatIDR(item.net_omzet_operasional)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                                Belum ada data tren pada periode ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </article>
                </section>
            </div>
        </DashboardLayout>
    );
}
