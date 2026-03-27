import { Head, router } from "@inertiajs/react";
import { Activity, AlertTriangle, ChartNoAxesCombined, CircleDollarSign, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { formatIDR } from "@/components/shared/pos/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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

function formatGrowth(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "n/a";
    }

    const numeric = Number(value);
    const prefix = numeric > 0 ? "+" : "";

    return `${prefix}${numeric.toFixed(2)}%`;
}

function buildSubmitParams(formData) {
    const nextPeriodType = (formData.get("period_type") || "daily").toString();
    const nextReferenceDate = (formData.get("reference_date") || "").toString();
    const nextDateFrom = (formData.get("date_from") || "").toString();
    const nextDateTo = (formData.get("date_to") || "").toString();
    const nextTopLimit = Number(formData.get("top_limit") || 10);

    return {
        period_type: nextPeriodType,
        reference_date: nextReferenceDate || undefined,
        date_from: nextPeriodType === "custom" ? (nextDateFrom || undefined) : undefined,
        date_to: nextPeriodType === "custom" ? (nextDateTo || undefined) : undefined,
        top_limit: Number.isFinite(nextTopLimit) ? Math.min(25, Math.max(3, nextTopLimit)) : 10,
    };
}

export default function Index({ overview, summary, filters }) {
    const endpoint = "/dashboard/overview";

    const dashboard = overview ?? {};
    const masterSummary = summary ?? dashboard?.master_summary ?? {};

    const penjualan = dashboard?.penjualan ?? {};
    const keuangan = dashboard?.keuangan ?? {};
    const performaMenu = dashboard?.performa_menu ?? {};
    const pettyCash = dashboard?.petty_cash ?? {};
    const waste = dashboard?.waste ?? {};
    const voidRefund = dashboard?.void_refund ?? {};
    const heatmap = dashboard?.heatmap ?? {};
    const stok = dashboard?.stok ?? {};
    const hutang = dashboard?.hutang ?? {};
    const shift = dashboard?.shift ?? {};
    const pajak = dashboard?.pajak ?? {};
    const opnameSelisih = dashboard?.opname_selisih ?? {};

    const activeFilters = filters ?? dashboard?.filters ?? {};
    const periodType = activeFilters?.period_type ?? "daily";
    const referenceDate = activeFilters?.reference_date ?? "";
    const dateFrom = activeFilters?.date_from ?? "";
    const dateTo = activeFilters?.date_to ?? "";
    const topLimit = activeFilters?.top_limit ?? 10;
    const effectiveRange = activeFilters?.effective_range;
    const previousRange = activeFilters?.previous_range;
    const kpiComparison = dashboard?.kpi_comparison ?? {};

    const salesTrendData = penjualan?.daily_trend ?? [];
    const paymentMethods = (penjualan?.payment_methods ?? []).slice(0, 6);
    const expenseBreakdown = (keuangan?.expense_breakdown ?? []).slice(0, 6);
    const bestSellers = (performaMenu?.best_sellers ?? []).slice(0, 8);
    const heatmapHourly = heatmap?.hourly_totals ?? [];
    const heatmapDays = heatmap?.days ?? [];
    const heatmapMatrix = heatmap?.heatmap ?? {};
    const heatmapMaxCount = Number(heatmap?.max_count ?? 0);
    const pajakHarian = (pajak?.harian ?? []).slice().reverse();

    const exportUrlPdf = `${endpoint}?${new URLSearchParams({
        period_type: String(periodType || "daily"),
        reference_date: String(referenceDate || ""),
        date_from: periodType === "custom" ? String(dateFrom || "") : "",
        date_to: periodType === "custom" ? String(dateTo || "") : "",
        top_limit: String(topLimit || 10),
        export: "pdf",
    }).toString()}`;

    const exportUrlExcel = `${endpoint}?${new URLSearchParams({
        period_type: String(periodType || "daily"),
        reference_date: String(referenceDate || ""),
        date_from: periodType === "custom" ? String(dateFrom || "") : "",
        date_to: periodType === "custom" ? String(dateTo || "") : "",
        top_limit: String(topLimit || 10),
        export: "excel",
    }).toString()}`;

    const kpiCards = [
        {
            label: "Omzet",
            value: formatIDR(penjualan?.summary?.omzet ?? 0),
            meta: `${penjualan?.summary?.jumlah_transaksi ?? 0} transaksi`,
            icon: CircleDollarSign,
            tone: "from-emerald-600 to-teal-500",
            comparison: kpiComparison?.omzet,
        },
        {
            label: "Net Income",
            value: formatIDR(keuangan?.summary?.net_income ?? 0),
            meta: `Margin ${formatPercent(keuangan?.summary?.margin_persen ?? 0)}`,
            icon: ChartNoAxesCombined,
            tone: "from-sky-600 to-cyan-500",
            comparison: kpiComparison?.net_income,
        },
        {
            label: "Refund Nominal",
            value: formatIDR(voidRefund?.summary?.total_refund_nominal ?? 0),
            meta: `${voidRefund?.summary?.total_refund ?? 0} refund`,
            icon: RefreshCw,
            tone: "from-amber-500 to-orange-500",
            comparison: kpiComparison?.refund_nominal,
        },
        {
            label: "Nilai Waste",
            value: formatIDR(waste?.summary?.total_nilai_kerugian ?? 0),
            meta: `${waste?.summary?.total_record ?? 0} record`,
            icon: AlertTriangle,
            tone: "from-rose-600 to-pink-500",
            comparison: kpiComparison?.waste_nilai,
        },
        {
            label: "Hutang Aktif",
            value: formatIDR(hutang?.summary?.total_hutang ?? 0),
            meta: `Overdue ${formatIDR(hutang?.summary?.overdue ?? 0)}`,
            icon: Wallet,
            tone: "from-violet-600 to-indigo-500",
            comparison: null,
        },
        {
            label: "Selisih Kas Shift",
            value: formatIDR(shift?.summary?.total_selisih_kas ?? 0),
            meta: `${shift?.summary?.total_shift ?? 0} shift`,
            icon: ShieldAlert,
            tone: "from-slate-700 to-slate-500",
            comparison: null,
        },
    ];

    const submitFilter = (event) => {
        event.preventDefault();
        const params = buildSubmitParams(new FormData(event.currentTarget));

        router.get(endpoint, params, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <DashboardLayout title="Overview Analytics">
            <Head title="Overview Dashboard" />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl border border-slate-800/20 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.25),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.2),transparent_45%),linear-gradient(135deg,#0f172a,#1e293b)] p-6 text-white shadow-xl md:p-8">
                    <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/80">Unified Overview</p>
                            <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">Ringkasan Seluruh Modul Laporan dalam Satu Halaman</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                                Penjualan, keuangan, stok, hutang, pajak, shift, waste, void/refund, hingga performa menu digabungkan dalam satu dashboard eksekutif.
                            </p>
                            {effectiveRange?.label ? (
                                <p className="mt-3 inline-flex items-center rounded-full border border-cyan-200/40 bg-cyan-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
                                    Periode efektif: {effectiveRange.label}
                                </p>
                            ) : null}
                            {previousRange?.label ? (
                                <p className="mt-2 inline-flex items-center rounded-full border border-indigo-200/40 bg-indigo-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100">
                                    Pembanding: {previousRange.label}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-slate-100">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wider text-slate-200">Total User</p>
                                <p className="mt-1 text-2xl font-semibold">{masterSummary?.total_user ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wider text-slate-200">Total Pegawai</p>
                                <p className="mt-1 text-2xl font-semibold">{masterSummary?.total_pegawai ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wider text-slate-200">Kategori Menu</p>
                                <p className="mt-1 text-2xl font-semibold">{masterSummary?.total_kategori_menu ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wider text-slate-200">Data Menu</p>
                                <p className="mt-1 text-2xl font-semibold">{masterSummary?.total_data_menu ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => window.open(exportUrlExcel, "_blank")}>Export Excel</Button>
                        <Button type="button" variant="outline" onClick={() => window.open(exportUrlPdf, "_blank")}>Export PDF</Button>
                    </div>
                    <form className="grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={submitFilter}>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Periode</label>
                            <select name="period_type" defaultValue={periodType} className="h-10 w-full rounded-lg border px-3 text-sm">
                                <option value="daily">Harian</option>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Acuan</label>
                            <input type="date" name="reference_date" defaultValue={referenceDate} className="h-10 w-full rounded-lg border px-3 text-sm" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dari (Custom)</label>
                            <input type="date" name="date_from" defaultValue={dateFrom} className="h-10 w-full rounded-lg border px-3 text-sm" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sampai (Custom)</label>
                            <input type="date" name="date_to" defaultValue={dateTo} className="h-10 w-full rounded-lg border px-3 text-sm" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Limit</label>
                            <input type="number" name="top_limit" min={3} max={25} defaultValue={topLimit} className="h-10 w-full rounded-lg border px-3 text-sm" />
                        </div>

                        <div className="flex items-end">
                            <Button type="submit" className="h-10 w-full">
                                Terapkan Filter
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {kpiCards.map((item) => (
                        <Card key={item.label} className="overflow-hidden border-slate-200/70">
                            <CardHeader className="relative pb-2">
                                <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${item.tone}`} />
                                <CardTitle className="flex items-center justify-between text-sm text-slate-600">
                                    {item.label}
                                    <item.icon className="h-4 w-4 text-slate-400" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.meta}</p>
                                {item.comparison ? (
                                    <p className={`mt-2 text-xs font-semibold ${Number(item.comparison?.delta_percent ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                        vs periode sebelumnya: {formatGrowth(item.comparison?.delta_percent)}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Tren Omzet Harian</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ omzet: { label: "Omzet", color: "#0ea5e9" } }}
                            >
                                <AreaChart data={salesTrendData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="tanggal" tickLine={false} axisLine={false} minTickGap={20} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area type="monotone" dataKey="omzet" stroke="var(--color-omzet)" fill="var(--color-omzet)" fillOpacity={0.2} />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Komposisi Metode Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ nominal: { label: "Nominal", color: "#10b981" } }}
                            >
                                <PieChart>
                                    <Pie data={paymentMethods} dataKey="total_nominal" nameKey="nama" outerRadius={100} fill="var(--color-nominal)" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {paymentMethods.map((method) => (
                                    <div key={method.kode || method.nama} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                        <p className="font-semibold text-slate-700">{method.nama}</p>
                                        <p className="text-slate-600">{formatIDR(method.total_nominal)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="rounded-3xl border-slate-200/70 xl:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Breakdown Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ total_nominal: { label: "Nominal", color: "#f59e0b" } }}
                            >
                                <BarChart data={expenseBreakdown}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="kategori" tickLine={false} axisLine={false} minTickGap={16} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="total_nominal" radius={[8, 8, 0, 0]} fill="var(--color-total_nominal)" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Pajak dan Service</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Titipan Pajak + SC</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{formatIDR(pajak?.summary?.total_titipan ?? 0)}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Efektif Pajak</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(pajak?.summary?.efektif_persen ?? 0)}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Petty Cash Keluar</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{formatIDR(pettyCash?.summary?.petty_cash_keluar ?? 0)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Performa Menu (Top Seller)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ total_qty: { label: "Qty", color: "#22c55e" } }}
                            >
                                <BarChart data={bestSellers}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="nama_menu" tickLine={false} axisLine={false} minTickGap={14} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="total_qty" radius={[8, 8, 0, 0]} fill="var(--color-total_qty)" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Distribusi Jam Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ jumlah: { label: "Jumlah", color: "#8b5cf6" } }}
                            >
                                <LineChart data={heatmapHourly}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="jam" tickLine={false} axisLine={false} minTickGap={18} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="jumlah" stroke="var(--color-jumlah)" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ChartContainer>
                            <p className="mt-2 text-xs text-slate-500">
                                Peak: {heatmap?.peak?.day || "-"} {heatmap?.peak?.hour || "-"} ({heatmap?.peak?.count || 0} transaksi)
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Heatmap Transaksi 7x24</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <div className="grid min-w-245 grid-cols-[140px_repeat(24,minmax(30px,1fr))] gap-1 text-[11px]">
                                    <div className="sticky left-0 z-10 bg-white" />
                                    {Array.from({ length: 24 }, (_, hour) => (
                                        <div key={`header-${hour}`} className="text-center font-semibold text-slate-500">{String(hour).padStart(2, "0")}</div>
                                    ))}

                                    {heatmapDays.map((day) => (
                                        <div key={day} className="contents">
                                            <div key={`${day}-label`} className="sticky left-0 z-10 rounded-md bg-slate-50 px-2 py-1 font-semibold text-slate-700">
                                                {day}
                                            </div>
                                            {Array.from({ length: 24 }, (_, hour) => {
                                                const count = Number(heatmapMatrix?.[day]?.[hour]?.jumlah ?? 0);
                                                const intensity = heatmapMaxCount > 0 ? count / heatmapMaxCount : 0;
                                                const alpha = Math.max(0.08, Math.min(0.9, intensity));

                                                return (
                                                    <div
                                                        key={`${day}-${hour}`}
                                                        className="flex h-8 items-center justify-center rounded-md border border-slate-100 font-semibold text-slate-700"
                                                        style={{ backgroundColor: `rgba(14,165,233,${alpha})` }}
                                                        title={`${day} ${String(hour).padStart(2, "0")}:00 - ${count} transaksi`}
                                                    >
                                                        {count > 0 ? count : ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="rounded-3xl border-slate-200/70 xl:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Risk Panel Operasional</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-amber-50 text-amber-700">Void Rate: {formatPercent(voidRefund?.summary?.void_rate ?? 0)}</Badge>
                                <Badge variant="outline" className="bg-rose-50 text-rose-700">Overdue Hutang: {formatIDR(hutang?.summary?.overdue ?? 0)}</Badge>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">Opname Danger: {opnameSelisih?.summary?.danger_count ?? 0}</Badge>
                                <Badge variant="outline" className="bg-sky-50 text-sky-700">Low Stock: {stok?.summary?.low_stock_items ?? 0}</Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border bg-slate-50 p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top Alasan Void</p>
                                    <ul className="space-y-1 text-sm">
                                        {(voidRefund?.top_alasan_void ?? []).slice(0, 5).map((item, index) => (
                                            <li key={`${item.alasan}-${index}`} className="flex items-center justify-between">
                                                <span className="text-slate-700">{item.alasan}</span>
                                                <strong className="text-slate-900">{item.jumlah}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border bg-slate-50 p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top Low Stock</p>
                                    <ul className="space-y-1 text-sm">
                                        {(stok?.low_stocks ?? []).slice(0, 5).map((item) => (
                                            <li key={item.id} className="flex items-center justify-between">
                                                <span className="text-slate-700">{item.nama}</span>
                                                <strong className="text-slate-900">{item.stok_saat_ini} {item.satuan}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Snapshot Shift</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Total Shift</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{shift?.summary?.total_shift ?? 0}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Shift Closed</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{shift?.summary?.shift_closed ?? 0}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Total Penjualan Shift</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{formatIDR(shift?.summary?.total_penjualan ?? 0)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Jatuh Tempo Hutang Terdekat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Sisa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(hutang?.recent_due ?? []).length > 0 ? (
                                        (hutang?.recent_due ?? []).map((item) => (
                                            <TableRow key={item.kode}>
                                                <TableCell className="font-medium">{item.kode}</TableCell>
                                                <TableCell>{item.supplier}</TableCell>
                                                <TableCell className="text-right">{formatIDR(item.sisa_hutang)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-6 text-center text-sm text-slate-500">Tidak ada hutang jatuh tempo terdekat.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200/70">
                        <CardHeader>
                            <CardTitle className="text-base">Timeline Pajak Harian</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                className="h-70 w-full"
                                config={{ total_pajak: { label: "Pajak", color: "#ef4444" } }}
                            >
                                <LineChart data={pajakHarian}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="tanggal" tickLine={false} axisLine={false} minTickGap={16} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="total_pajak" stroke="var(--color-total_pajak)" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Stok Habis</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-semibold">{stok?.summary?.out_of_stock_items ?? 0}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Nilai Stok</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-semibold">{formatIDR(stok?.summary?.total_stock_value ?? 0)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Danger Opname</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-semibold">{opnameSelisih?.summary?.danger_count ?? 0}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Transaksi Pajak</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-slate-500" />
                                <p className="text-2xl font-semibold">{pajak?.summary?.total_transaksi ?? 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DashboardLayout>
    );
}
