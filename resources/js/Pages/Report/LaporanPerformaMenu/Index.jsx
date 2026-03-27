import { Head, router } from "@inertiajs/react";
import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

function pct(v) { return `${Number(v || 0).toFixed(2)}%`; }

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-performa-menu";
	const bestSellers = report?.best_sellers ?? [];
	const deadStock = report?.dead_stock ?? [];
	const ticket = report?.ticket_size ?? {};
	const diskon = report?.diskon ?? {};
	const periodType = filters?.period_type ?? "daily";
	const referenceDate = filters?.reference_date ?? "";
	const dateFrom = filters?.date_from ?? "";
	const dateTo = filters?.date_to ?? "";
	const topLimit = filters?.top_limit ?? 10;
	const effectiveRange = filters?.effective_range;

	const submitFilter = (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.get(endpoint, { period_type: fd.get("period_type") || "daily", reference_date: fd.get("reference_date") || undefined, date_from: fd.get("period_type") === "custom" ? fd.get("date_from") || undefined : undefined, date_to: fd.get("period_type") === "custom" ? fd.get("date_to") || undefined : undefined, top_limit: Number(fd.get("top_limit") || 10) }, { preserveState: true, replace: true }); };

	const buildExportUrl = (type) => {
		const params = new URLSearchParams();
		params.set("period_type", periodType);
		if (referenceDate) params.set("reference_date", referenceDate);
		if (periodType === "custom") {
			if (dateFrom) params.set("date_from", dateFrom);
			if (dateTo) params.set("date_to", dateTo);
		}
		params.set("top_limit", String(topLimit));
		params.set("export", type);
		return `${endpoint}?${params.toString()}`;
	};

	return (
		<DashboardLayout title="Laporan Performa Menu">
			<Head title="Laporan Performa Menu" />
			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Performa Menu & Sales</h1>
					<p className="mt-1 text-sm text-slate-600">Best seller, dead stock, average ticket size, dan efektivitas diskon.</p>
					{effectiveRange?.label ? <p className="mt-2 text-sm font-medium text-slate-700">Periode: {effectiveRange.label}</p> : null}
				</section>

				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<div className="mb-3 flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("excel"), "_blank")}>Export Excel</Button>
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("pdf"), "_blank")}>Export PDF</Button>
					</div>
					<form className="grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={submitFilter}>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Periode</label><select name="period_type" defaultValue={periodType} className="h-10 w-full rounded-lg border px-3 text-sm"><option value="daily">Harian</option><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="custom">Custom</option></select></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Acuan</label><input type="date" name="reference_date" defaultValue={referenceDate} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dari</label><input type="date" name="date_from" defaultValue={dateFrom} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sampai</label><input type="date" name="date_to" defaultValue={dateTo} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top N</label><input type="number" name="top_limit" min={3} max={25} defaultValue={topLimit} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="flex items-end"><Button type="submit" className="w-full">Terapkan</Button></div>
					</form>
				</section>

				{/* Summary Cards */}
				<section className="grid gap-4 md:grid-cols-4">
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Avg Ticket Size</p><p className="mt-2 text-2xl font-semibold text-violet-700">{formatIDR(ticket.avg_ticket ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Transaksi</p><p className="mt-2 text-2xl font-semibold text-slate-900">{ticket.total_transaksi ?? 0}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Diskon Dibakar</p><p className="mt-2 text-2xl font-semibold text-amber-600">{formatIDR(diskon.total_diskon ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">% Tx Pakai Diskon</p><p className="mt-2 text-2xl font-semibold text-amber-600">{pct(diskon.persen_tx_diskon ?? 0)}</p></div>
				</section>

				{/* Best Sellers */}
				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">🏆 Best Seller (Top {topLimit}) + Margin</h2>
					<Table>
						<TableHeader><TableRow><TableHead>Menu</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">HPP</TableHead><TableHead className="text-right">Margin</TableHead><TableHead className="text-right">Margin %</TableHead></TableRow></TableHeader>
						<TableBody>{bestSellers.length > 0 ? bestSellers.map((item, i) => (
							<TableRow key={i}><TableCell className="font-medium">{item.nama_menu}</TableCell><TableCell className="text-right">{item.total_qty}</TableCell><TableCell className="text-right">{formatIDR(item.total_revenue)}</TableCell><TableCell className="text-right text-red-600">{formatIDR(item.total_hpp)}</TableCell><TableCell className={`text-right font-semibold ${item.margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatIDR(item.margin)}</TableCell><TableCell className={`text-right ${item.margin_persen >= 30 ? "text-emerald-700" : item.margin_persen >= 15 ? "text-amber-600" : "text-red-600"}`}>{pct(item.margin_persen)}</TableCell></TableRow>
						)) : <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</TableCell></TableRow>}</TableBody>
					</Table>
				</section>

				<section className="grid gap-4 lg:grid-cols-2">
					{/* Dead Stock */}
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">💀 Dead Stock (5 Terbawah)</h2>
						<Table>
							<TableHeader><TableRow><TableHead>Menu</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
							<TableBody>{deadStock.length > 0 ? deadStock.map((item, i) => (
								<TableRow key={i} className="bg-red-50/50"><TableCell className="font-medium">{item.nama_menu}</TableCell><TableCell className="text-right text-red-600">{item.total_qty}</TableCell><TableCell className="text-right">{formatIDR(item.total_revenue)}</TableCell></TableRow>
							)) : <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</TableCell></TableRow>}</TableBody>
						</Table>
					</article>

					{/* Discount Effectiveness */}
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">🎯 Efektivitas Diskon</h2>
						<div className="space-y-2 text-sm">
							<div className="flex items-center justify-between rounded-lg border p-3"><span>Total Diskon Dibakar</span><strong className="text-amber-600">{formatIDR(diskon.total_diskon ?? 0)}</strong></div>
							<div className="flex items-center justify-between rounded-lg border p-3"><span>Transaksi dengan Diskon</span><strong>{diskon.transaksi_dengan_diskon ?? 0} / {diskon.transaksi_total ?? 0}</strong></div>
							<div className="flex items-center justify-between rounded-lg border p-3"><span>Revenue (Pakai Diskon)</span><strong className="text-emerald-700">{formatIDR(diskon.revenue_dengan_diskon ?? 0)}</strong></div>
							<div className="flex items-center justify-between rounded-lg border p-3"><span>Revenue (Tanpa Diskon)</span><strong>{formatIDR(diskon.revenue_tanpa_diskon ?? 0)}</strong></div>
						</div>
					</article>
				</section>
			</div>
		</DashboardLayout>
	);
}
