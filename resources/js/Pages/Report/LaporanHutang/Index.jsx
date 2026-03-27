import { Head } from "@inertiajs/react";

import { formatIDR } from "@/components/shared/pos/format";
import { Button } from "@/components/ui/button";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index({ report }) {
	const endpoint = "/report/laporan-hutang";
	const summary = report?.summary ?? {};
	const aging = report?.aging ?? [];
	const perSupplier = report?.per_supplier ?? [];
	const recentDue = report?.recent_due ?? [];

	const buildExportUrl = (type) => {
		const params = new URLSearchParams();
		params.set("export", type);
		return `${endpoint}?${params.toString()}`;
	};

	return (
		<DashboardLayout title="Laporan Hutang">
			<Head title="Laporan Hutang Supplier" />

			<div className="space-y-6">
				<section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Report</p>
					<h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Hutang Supplier</h1>
					<p className="mt-1 text-sm text-slate-600">Ringkasan status hutang, aging schedule, dan alert jatuh tempo.</p>
				</section>

				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<div className="mb-3 flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("excel"), "_blank")}>Export Excel</Button>
						<Button type="button" variant="outline" onClick={() => window.open(buildExportUrl("pdf"), "_blank")}>Export PDF</Button>
					</div>
				</section>

				{/* Summary Cards */}
				<section className="grid gap-4 md:grid-cols-4">
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Total Hutang Aktif</p>
						<p className="mt-2 text-2xl font-semibold text-orange-700">{formatIDR(summary.total_hutang ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Jatuh Tempo Minggu Ini</p>
						<p className="mt-2 text-2xl font-semibold text-amber-600">{formatIDR(summary.jatuh_tempo_minggu_ini ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Overdue</p>
						<p className="mt-2 text-2xl font-semibold text-red-600">{formatIDR(summary.overdue ?? 0)}</p>
					</div>
					<div className="rounded-2xl border bg-white p-4 shadow-sm">
						<p className="text-xs uppercase tracking-widest text-slate-500">Total Sudah Lunas</p>
						<p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary.total_lunas ?? 0)}</p>
					</div>
				</section>

				{/* Aging Schedule */}
				<section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Aging Schedule</h2>
					<div className="grid gap-3 md:grid-cols-4">
						{aging.map((item, idx) => (
							<div key={idx} className={`rounded-xl border-2 p-4 ${idx === 0 ? "border-emerald-200 bg-emerald-50" : idx === 1 ? "border-amber-200 bg-amber-50" : idx === 2 ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}`}>
								<p className="text-xs font-medium text-slate-600">{item.label}</p>
								<p className={`mt-1 text-xl font-bold ${idx === 0 ? "text-emerald-700" : idx === 1 ? "text-amber-700" : idx === 2 ? "text-orange-700" : "text-red-700"}`}>{formatIDR(item.nominal)}</p>
							</div>
						))}
					</div>
				</section>

				{/* Per Supplier & Recent Due */}
				<section className="grid gap-4 lg:grid-cols-2">
					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Hutang Per Supplier</h2>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Supplier</TableHead>
									<TableHead className="text-right">Tagihan</TableHead>
									<TableHead className="text-right">Sisa Hutang</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{perSupplier.length > 0 ? perSupplier.map((item, idx) => (
									<TableRow key={idx}>
										<TableCell className="font-medium">{item.supplier}</TableCell>
										<TableCell className="text-right">{item.jumlah_tagihan}</TableCell>
										<TableCell className="text-right">{formatIDR(item.total_sisa)}</TableCell>
									</TableRow>
								)) : (
									<TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Tidak ada hutang aktif.</TableCell></TableRow>
								)}
							</TableBody>
						</Table>
					</article>

					<article className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Segera Jatuh Tempo (7 Hari)</h2>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Kode</TableHead>
									<TableHead>Supplier</TableHead>
									<TableHead>Jatuh Tempo</TableHead>
									<TableHead className="text-right">Sisa</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recentDue.length > 0 ? recentDue.map((item, idx) => (
									<TableRow key={idx} className={item.is_overdue ? "bg-red-50" : ""}>
										<TableCell className="font-medium">{item.kode}</TableCell>
										<TableCell>{item.supplier}</TableCell>
										<TableCell>
											<span className={item.is_overdue ? "font-semibold text-red-600" : ""}>{item.jatuh_tempo}</span>
											{item.is_overdue ? <span className="ml-1 text-xs text-red-500">(Overdue)</span> : null}
										</TableCell>
										<TableCell className="text-right">{formatIDR(item.sisa_hutang)}</TableCell>
									</TableRow>
								)) : (
									<TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">Tidak ada hutang yang segera jatuh tempo.</TableCell></TableRow>
								)}
							</TableBody>
						</Table>
					</article>
				</section>
			</div>
		</DashboardLayout>
	);
}
