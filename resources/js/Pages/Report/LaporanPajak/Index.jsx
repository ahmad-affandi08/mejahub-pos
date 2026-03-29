import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index({ laporanPajak, filters, flashMessage }) {
    const endpoint = "/report/laporan-pajak";
    const searchValue = filters?.search ?? "";
    const rows = laporanPajak?.data ?? [];
    const hasData = rows.length > 0;
    const currentPage = laporanPajak?.meta?.current_page ?? 1;
    const lastPage = laporanPajak?.meta?.last_page ?? 1;
    const total = laporanPajak?.meta?.total ?? 0;

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();

        router.get(endpoint, { search }, { preserveState: true, replace: true });
    };

    const goPage = (page) => {
        router.get(endpoint, { search: searchValue, page }, { preserveState: true });
    };

    return (
        <DashboardLayout title="Laporan Pajak">
            <Head title="Laporan Pajak" />
            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Report</p>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Pajak</h1>
                    <p className="mt-2 text-sm text-slate-600">Rekap pajak harian dari transaksi pesanan berstatus lunas.</p>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari tanggal (YYYY-MM-DD)"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Total Transaksi</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>Total Pajak</TableHead>
                                <TableHead>Total Bruto</TableHead>
                                <TableHead>Efektif (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                rows.map((item, index) => (
                                    <TableRow key={`${item.tanggal}-${index}`}>
                                        <TableCell className="font-medium">{item.tanggal || "-"}</TableCell>
                                        <TableCell>{item.total_transaksi}</TableCell>
                                        <TableCell>{formatIDR(item.total_subtotal)}</TableCell>
                                        <TableCell>{formatIDR(item.total_pajak)}</TableCell>
                                        <TableCell>{formatIDR(item.total_bruto)}</TableCell>
                                        <TableCell>{item.efektif_persen}%</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data laporan pajak.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect currentPage={currentPage} lastPage={lastPage} total={total} onPageChange={goPage} />
                </section>
            </div>
        </DashboardLayout>
    );
}
