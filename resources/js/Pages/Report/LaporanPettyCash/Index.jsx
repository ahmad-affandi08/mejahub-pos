import { Head, router } from "@inertiajs/react";
import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-petty-cash";
	const summary = report?.summary ?? {};
	const expenseByCategory = report?.expense_by_category ?? [];
	const pcDetails = report?.petty_cash_details ?? [];
	const periodType = filters?.period_type ?? "daily";
	const referenceDate = filters?.reference_date ?? "";
	const dateFrom = filters?.date_from ?? "";
	const dateTo = filters?.date_to ?? "";
	const effectiveRange = filters?.effective_range;

	const submitFilter = (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.get(endpoint, { period_type: fd.get("period_type") || "daily", reference_date: fd.get("reference_date") || undefined, date_from: fd.get("period_type") === "custom" ? fd.get("date_from") || undefined : undefined, date_to: fd.get("period_type") === "custom" ? fd.get("date_to") || undefined : undefined }, { preserveState: true, replace: true }); };

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
		<DashboardLayout title="Laporan Petty Cash & Pengeluaran">
			<Head title="Laporan Petty Cash & Pengeluaran" />
			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Petty Cash & Pengeluaran</h1>
					<p className="mt-1 text-sm text-slate-600">Arus kas keluar untuk operasional harian dan breakdown pengeluaran per kategori.</p>
					{effectiveRange?.label ? <p className="mt-2 text-sm font-medium text-slate-700">Periode: {effectiveRange.label}</p> : null}
				</section>

				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<div className="mb-3 flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("excel"), "_blank")}>Export Excel</Button>
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("pdf"), "_blank")}>Export PDF</Button>
					</div>
					<form className="grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={submitFilter}>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Periode</label><select name="period_type" defaultValue={periodType} className="h-10 w-full rounded-lg border px-3 text-sm"><option value="daily">Harian</option><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="custom">Custom</option></select></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal Acuan</label><input type="date" name="reference_date" defaultValue={referenceDate} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dari</label><input type="date" name="date_from" defaultValue={dateFrom} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sampai</label><input type="date" name="date_to" defaultValue={dateTo} className="h-10 w-full rounded-lg border px-3 text-sm" /></div>
						<div className="flex items-end"><Button type="submit" className="w-full">Terapkan</Button></div>
					</form>
				</section>

				<section className="grid gap-4 md:grid-cols-4">
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Petty Cash Masuk</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary.petty_cash_masuk ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Petty Cash Keluar</p><p className="mt-2 text-2xl font-semibold text-red-600">{formatIDR(summary.petty_cash_keluar ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Saldo Terakhir</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatIDR(summary.saldo_terakhir ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Pengeluaran</p><p className="mt-2 text-2xl font-semibold text-red-600">{formatIDR(summary.total_pengeluaran ?? 0)}</p></div>
				</section>

				<section className="grid gap-4 lg:grid-cols-2">
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Pengeluaran per Kategori</h2>
						<Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
							<TableBody>{expenseByCategory.length > 0 ? expenseByCategory.map((item, i) => (<TableRow key={i}><TableCell className="font-medium">{item.kategori}</TableCell><TableCell className="text-right">{item.jumlah}</TableCell><TableCell className="text-right">{formatIDR(item.total)}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>}</TableBody></Table>
					</article>

					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Riwayat Petty Cash</h2>
						<div className="max-h-80 overflow-auto">
							<Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Tanggal</TableHead><TableHead>Arus</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
								<TableBody>{pcDetails.length > 0 ? pcDetails.map((item, i) => (<TableRow key={i}><TableCell className="font-medium text-xs">{item.kode}</TableCell><TableCell>{item.tanggal}</TableCell><TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${item.arus === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.arus === 'in' ? 'Masuk' : 'Keluar'}</span></TableCell><TableCell className="text-right">{formatIDR(item.nominal)}</TableCell><TableCell className="text-right">{formatIDR(item.saldo)}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>}</TableBody></Table>
						</div>
					</article>
				</section>
			</div>
		</DashboardLayout>
	);
}
