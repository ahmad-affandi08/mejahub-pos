import { Head, router } from "@inertiajs/react";
import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";

function getHeatColor(count, max) {
	if (max === 0 || count === 0) return "bg-slate-100 text-slate-400";
	const ratio = count / max;
	if (ratio > 0.8) return "bg-red-600 text-white font-bold";
	if (ratio > 0.6) return "bg-orange-500 text-white font-semibold";
	if (ratio > 0.4) return "bg-amber-400 text-slate-900";
	if (ratio > 0.2) return "bg-yellow-200 text-slate-700";
	return "bg-emerald-100 text-slate-600";
}

export default function Index({ report, filters }) {
	const endpoint = "/report/laporan-heatmap";
	const heatmap = report?.heatmap ?? {};
	const maxCount = report?.max_count ?? 0;
	const peak = report?.peak ?? {};
	const hourlyTotals = report?.hourly_totals ?? [];
	const days = report?.days ?? [];
	const periodType = filters?.period_type ?? "weekly";
	const referenceDate = filters?.reference_date ?? "";
	const dateFrom = filters?.date_from ?? "";
	const dateTo = filters?.date_to ?? "";
	const effectiveRange = filters?.effective_range;

	const hours = Array.from({ length: 24 }, (_, i) => i);

	const submitFilter = (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.get(endpoint, { period_type: fd.get("period_type") || "weekly", reference_date: fd.get("reference_date") || undefined, date_from: fd.get("period_type") === "custom" ? fd.get("date_from") || undefined : undefined, date_to: fd.get("period_type") === "custom" ? fd.get("date_to") || undefined : undefined }, { preserveState: true, replace: true }); };

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
		<DashboardLayout title="Heatmap Transaksi">
			<Head title="Heatmap Transaksi" />
			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Kepadatan Transaksi per Jam</h1>
					<p className="mt-1 text-sm text-slate-600">Visualisasi jam-jam sibuk untuk pengaturan shift pelayan dan koki.</p>
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

				{/* Peak Info */}
				<section className="grid gap-4 md:grid-cols-3">
					<div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-red-700">🔥 Jam Tersibuk</p>
						<p className="mt-2 text-2xl font-bold text-red-700">{peak.day ?? '-'}, {peak.hour ?? '-'}</p>
						<p className="text-sm text-red-600">{peak.count ?? 0} transaksi</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Max per Slot</p>
						<p className="mt-2 text-2xl font-semibold text-slate-900">{maxCount} tx</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Legend</p>
						<div className="mt-2 flex gap-1">
							<span className="rounded bg-emerald-100 px-2 py-0.5 text-xs">Low</span>
							<span className="rounded bg-yellow-200 px-2 py-0.5 text-xs">Med</span>
							<span className="rounded bg-amber-400 px-2 py-0.5 text-xs">High</span>
							<span className="rounded bg-orange-500 px-2 py-0.5 text-xs text-white">Very High</span>
							<span className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">Peak</span>
						</div>
					</div>
				</section>

				{/* Heatmap Grid */}
				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Heatmap (Hari × Jam)</h2>
					<div className="overflow-auto">
						<table className="w-full border-collapse text-center text-xs">
							<thead>
								<tr>
									<th className="sticky left-0 bg-white p-2 text-left font-medium text-slate-500">Hari</th>
									{hours.map((h) => <th key={h} className="min-w-[36px] p-1 font-medium text-slate-500">{String(h).padStart(2, '0')}</th>)}
								</tr>
							</thead>
							<tbody>
								{days.map((day) => (
									<tr key={day}>
										<td className="sticky left-0 bg-white p-2 text-left font-medium text-slate-700">{day}</td>
										{hours.map((h) => {
											const cell = heatmap?.[day]?.[h] ?? { jumlah: 0 };
											return (
												<td key={h} className={`p-1`} title={`${day} ${String(h).padStart(2, '0')}:00 — ${cell.jumlah} tx`}>
													<div className={`mx-auto flex h-8 w-8 items-center justify-center rounded ${getHeatColor(cell.jumlah, maxCount)}`}>
														{cell.jumlah > 0 ? cell.jumlah : ''}
													</div>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</DashboardLayout>
	);
}
