import { Head, router } from "@inertiajs/react";
import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

function pct(v) { return `${Number(v || 0).toFixed(2)}%`; }

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-void-refund";
	const summary = report?.summary ?? {};
	const voidPerKasir = report?.void_per_kasir ?? [];
	const refundPerKasir = report?.refund_per_kasir ?? [];
	const topAlasan = report?.top_alasan_void ?? [];
	const periodType = filters?.period_type ?? "monthly";
	const referenceDate = filters?.reference_date ?? "";
	const dateFrom = filters?.date_from ?? "";
	const dateTo = filters?.date_to ?? "";
	const effectiveRange = filters?.effective_range;

	const submitFilter = (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.get(endpoint, { period_type: fd.get("period_type") || "monthly", reference_date: fd.get("reference_date") || undefined, date_from: fd.get("period_type") === "custom" ? fd.get("date_from") || undefined : undefined, date_to: fd.get("period_type") === "custom" ? fd.get("date_to") || undefined : undefined }, { preserveState: true, replace: true }); };

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
		<DashboardLayout title="Laporan Void & Refund">
			<Head title="Laporan Void & Refund" />
			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Tingkat Void & Refund per Kasir</h1>
					<p className="mt-1 text-sm text-slate-600">Deteksi potensi kecurangan kasir atau kebutuhan pelatihan SDM.</p>
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
				<section className="grid gap-4 md:grid-cols-5">
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Void</p><p className="mt-2 text-2xl font-semibold text-red-600">{summary.total_void ?? 0}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Refund</p><p className="mt-2 text-2xl font-semibold text-orange-600">{summary.total_refund ?? 0}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Nominal Refund</p><p className="mt-2 text-2xl font-semibold text-red-600">{formatIDR(summary.total_refund_nominal ?? 0)}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Transaksi</p><p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total_transaksi ?? 0}</p></div>
					<div className={`rounded-2xl border-2 p-4 shadow-sm ${(summary.void_rate ?? 0) > 5 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}><p className="text-xs uppercase tracking-widest text-slate-500">Void Rate</p><p className={`mt-2 text-2xl font-bold ${(summary.void_rate ?? 0) > 5 ? "text-red-700" : "text-emerald-700"}`}>{pct(summary.void_rate ?? 0)}</p></div>
				</section>
				<section className="grid gap-4 lg:grid-cols-3">
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Void per Kasir</h2>
						<Table><TableHeader><TableRow><TableHead>Kasir</TableHead><TableHead className="text-right">Jumlah Void</TableHead></TableRow></TableHeader>
							<TableBody>{voidPerKasir.length > 0 ? voidPerKasir.map((item, i) => (<TableRow key={i}><TableCell className="font-medium">{item.kasir}</TableCell><TableCell className="text-right text-red-600 font-semibold">{item.jumlah_void}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>}</TableBody></Table>
					</article>
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Refund per Kasir</h2>
						<Table><TableHeader><TableRow><TableHead>Kasir</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
							<TableBody>{refundPerKasir.length > 0 ? refundPerKasir.map((item, i) => (<TableRow key={i}><TableCell className="font-medium">{item.kasir}</TableCell><TableCell className="text-right">{item.jumlah_refund}</TableCell><TableCell className="text-right text-red-600">{formatIDR(item.total_nominal)}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>}</TableBody></Table>
					</article>
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Top Alasan Void</h2>
						<Table><TableHeader><TableRow><TableHead>Alasan</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader>
							<TableBody>{topAlasan.length > 0 ? topAlasan.map((item, i) => (<TableRow key={i}><TableCell className="font-medium">{item.alasan}</TableCell><TableCell className="text-right">{item.jumlah}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>}</TableBody></Table>
					</article>
				</section>
			</div>
		</DashboardLayout>
	);
}
