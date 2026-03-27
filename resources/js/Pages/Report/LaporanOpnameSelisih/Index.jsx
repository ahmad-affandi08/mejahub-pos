import { Head, router } from "@inertiajs/react";
import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

function pct(v) { return `${Number(v || 0).toFixed(2)}%`; }
const levelColors = { danger: "bg-red-100 text-red-700", warning: "bg-amber-100 text-amber-700", normal: "bg-emerald-100 text-emerald-700" };
const levelLabels = { danger: "BAHAYA", warning: "WASPADA", normal: "NORMAL" };

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-opname-selisih";
	const summary = report?.summary ?? {};
	const details = report?.details ?? [];
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
		<DashboardLayout title="Laporan Opname Selisih">
			<Head title="Laporan Selisih Opname Stok" />
			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Selisih Opname Stok</h1>
					<p className="mt-1 text-sm text-slate-600">Perbandingan stok sistem vs stok fisik — deteksi boros pemakaian atau potensi pencurian.</p>
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
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Opname</p><p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total_opname ?? 0}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Selisih Positif (Lebih)</p><p className="mt-2 text-2xl font-semibold text-emerald-700">+{Number(summary.selisih_positif ?? 0).toLocaleString('id-ID')}</p></div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Selisih Negatif (Kurang)</p><p className="mt-2 text-2xl font-semibold text-red-600">{Number(summary.selisih_negatif ?? 0).toLocaleString('id-ID')}</p></div>
					<div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-red-700">🚨 BAHAYA / ⚠️ WASPADA</p><p className="mt-2 text-2xl font-bold text-red-700">{summary.danger_count ?? 0} / {summary.warning_count ?? 0}</p></div>
				</section>
				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Detail Selisih Opname</h2>
					<div className="overflow-auto">
						<Table>
							<TableHeader><TableRow><TableHead>Tgl</TableHead><TableHead>Bahan</TableHead><TableHead className="text-right">Sistem</TableHead><TableHead className="text-right">Fisik</TableHead><TableHead className="text-right">Selisih</TableHead><TableHead className="text-right">%</TableHead><TableHead className="text-right">Nilai</TableHead><TableHead>Status</TableHead><TableHead>Petugas</TableHead></TableRow></TableHeader>
							<TableBody>{details.length > 0 ? details.map((d, i) => (
								<TableRow key={i} className={d.level === 'danger' ? 'bg-red-50' : d.level === 'warning' ? 'bg-amber-50' : ''}>
									<TableCell className="text-xs">{d.tanggal}</TableCell>
									<TableCell className="font-medium">{d.bahan} <span className="text-xs text-muted-foreground">({d.satuan})</span></TableCell>
									<TableCell className="text-right">{d.stok_sistem}</TableCell>
									<TableCell className="text-right">{d.stok_fisik}</TableCell>
									<TableCell className={`text-right font-semibold ${d.selisih < 0 ? 'text-red-600' : d.selisih > 0 ? 'text-emerald-600' : ''}`}>{d.selisih}</TableCell>
									<TableCell className="text-right">{pct(d.persen_selisih)}</TableCell>
									<TableCell className="text-right">{formatIDR(d.nilai_selisih)}</TableCell>
									<TableCell><span className={`rounded px-2 py-0.5 text-xs font-bold ${levelColors[d.level]}`}>{levelLabels[d.level]}</span></TableCell>
									<TableCell className="text-xs">{d.petugas}</TableCell>
								</TableRow>
							)) : <TableRow><TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">Tidak ada data opname.</TableCell></TableRow>}</TableBody>
						</Table>
					</div>
				</section>
			</div>
		</DashboardLayout>
	);
}
