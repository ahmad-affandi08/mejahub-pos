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

function formatPercent(value) {
	return `${Number(value || 0).toFixed(2)}%`;
}

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-keuangan";

	const summary = report?.summary ?? {};
	const expenseBreakdown = report?.expense_breakdown ?? [];
	const dailyTrend = report?.daily_trend ?? [];

	const periodType = filters?.period_type ?? "daily";
	const referenceDate = filters?.reference_date ?? "";
	const dateFrom = filters?.date_from ?? "";
	const dateTo = filters?.date_to ?? "";
	const effectiveRange = filters?.effective_range;

	const submitFilter = (event) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const nextPeriodType = (formData.get("period_type") || "daily").toString();
		const nextReferenceDate = (formData.get("reference_date") || "").toString();
		const nextDateFrom = (formData.get("date_from") || "").toString();
		const nextDateTo = (formData.get("date_to") || "").toString();

		router.get(
			endpoint,
			{
				period_type: nextPeriodType,
				reference_date: nextReferenceDate || undefined,
				date_from: nextPeriodType === "custom" ? (nextDateFrom || undefined) : undefined,
				date_to: nextPeriodType === "custom" ? (nextDateTo || undefined) : undefined,
			},
			{ preserveState: true, replace: true },
		);
	};

	const buildExportUrl = (type) => {
		const params = new URLSearchParams();
		params.set("period_type", periodType);
		if (referenceDate) params.set("reference_date", referenceDate);
		if (periodType === "custom") {
			if (dateFrom) params.set("date_from", dateFrom);
			if (dateTo) params.set("date_to", dateTo);
		}
		params.set("export", type);
		return `${endpoint}?${params.toString()}`;
	};

	return (
		<DashboardLayout title="Laporan Keuangan">
			<Head title="Laporan Keuangan" />

			<div className="space-y-6">
				{/* Header */}
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Keuangan</h1>
					<p className="mt-1 text-sm text-slate-600">Laba Kotor (Gross Profit), HPP, arus kas keluar, dan net income per periode.</p>
					{effectiveRange?.label ? (
						<p className="mt-2 text-sm font-medium text-slate-700">Periode efektif: {effectiveRange.label}</p>
					) : null}
				</section>

				{/* Filter */}
				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<div className="mb-3 flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("excel"), "_blank")}>Export Excel</Button>
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("pdf"), "_blank")}>Export PDF</Button>
					</div>
					<form className="grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={submitFilter}>
						<div className="space-y-1">
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis Periode</label>
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
						<div className="flex items-end">
							<Button type="submit" className="w-full">Terapkan</Button>
						</div>
					</form>
				</section>

				{/* Summary Cards Row 1 */}
				<section className="grid gap-4 md:grid-cols-4">
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Pendapatan</p>
						<p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary.revenue ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">HPP (COGS)</p>
						<p className="mt-2 text-2xl font-semibold text-red-600">{formatIDR(summary.hpp ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Laba Kotor</p>
						<p className={`mt-2 text-2xl font-semibold ${(summary.gross_profit ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatIDR(summary.gross_profit ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Margin</p>
						<p className={`mt-2 text-2xl font-semibold ${(summary.margin_persen ?? 0) >= 30 ? "text-emerald-700" : (summary.margin_persen ?? 0) >= 15 ? "text-amber-600" : "text-red-600"}`}>{formatPercent(summary.margin_persen ?? 0)}</p>
					</div>
				</section>

				{/* Summary Cards Row 2 */}
				<section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Pajak Terkumpul</p>
						<p className="mt-2 text-lg font-semibold text-slate-900">{formatIDR(summary.pajak_terkumpul ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Service Charge</p>
						<p className="mt-2 text-lg font-semibold text-slate-900">{formatIDR(summary.service_charge ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Total Diskon</p>
						<p className="mt-2 text-lg font-semibold text-amber-600">{formatIDR(summary.total_diskon ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Pengeluaran</p>
						<p className="mt-2 text-lg font-semibold text-red-600">{formatIDR(summary.total_pengeluaran ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Petty Cash Keluar</p>
						<p className="mt-2 text-lg font-semibold text-red-600">{formatIDR(summary.petty_cash_keluar ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Hutang Aktif</p>
						<p className="mt-2 text-lg font-semibold text-orange-600">{formatIDR(summary.total_hutang_aktif ?? 0)}</p>
					</div>
				</section>

				{/* Net Income Highlight */}
				<section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Net Income (Laba Kotor - Pengeluaran - Petty Cash)</p>
							<p className={`mt-2 text-3xl font-bold ${(summary.net_income ?? 0) >= 0 ? "text-emerald-800" : "text-red-700"}`}>{formatIDR(summary.net_income ?? 0)}</p>
						</div>
					</div>
				</section>

				{/* Expense Breakdown & Trend */}
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
									expenseBreakdown.map((item, idx) => (
										<TableRow key={`${item.kategori}-${idx}`}>
											<TableCell className="font-medium">{item.kategori}</TableCell>
											<TableCell className="text-right">{item.jumlah}</TableCell>
											<TableCell className="text-right">{formatIDR(item.total_nominal)}</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
											Belum ada data pengeluaran pada periode ini.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</article>

					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Tren Pendapatan Harian</h2>
						<div className="max-h-80 overflow-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Tanggal</TableHead>
										<TableHead className="text-right">Transaksi</TableHead>
										<TableHead className="text-right">Pendapatan</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dailyTrend.length > 0 ? (
										dailyTrend.map((item) => (
											<TableRow key={item.tanggal}>
												<TableCell>{item.tanggal}</TableCell>
												<TableCell className="text-right">{item.transaksi}</TableCell>
												<TableCell className="text-right">{formatIDR(item.revenue)}</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
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
