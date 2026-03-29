import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("id-ID") : "-");

export default function Index({ laporanShift, filters, flashMessage }) {
    const endpoint = "/report/laporan-shift";
    const searchValue = filters?.search ?? "";
    const rows = laporanShift?.data ?? [];
    const hasData = rows.length > 0;
    const currentPage = laporanShift?.meta?.current_page ?? 1;
    const lastPage = laporanShift?.meta?.last_page ?? 1;
    const total = laporanShift?.meta?.total ?? 0;

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
        <DashboardLayout title="Laporan Shift">
            <Head title="Laporan Shift" />
            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Report</p>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Laporan Shift</h1>
                    <p className="mt-2 text-sm text-slate-600">Rekap performa setiap shift kasir berdasarkan data transaksi pembayaran.</p>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari kode shift, status, atau nama kasir"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode Shift</TableHead>
                                <TableHead>Kasir</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Waktu Buka</TableHead>
                                <TableHead>Waktu Tutup</TableHead>
                                <TableHead>Total Penjualan</TableHead>
                                <TableHead>Jumlah Pembayaran</TableHead>
                                <TableHead>Selisih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                rows.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.kode}</TableCell>
                                        <TableCell>{item.kasir_nama || "-"}</TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>{formatDateTime(item.waktu_buka)}</TableCell>
                                        <TableCell>{formatDateTime(item.waktu_tutup)}</TableCell>
                                        <TableCell>{formatIDR(item.total_penjualan)}</TableCell>
                                        <TableCell>{item.total_pembayaran}</TableCell>
                                        <TableCell>{item.selisih === null ? "-" : formatIDR(item.selisih)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data shift.
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
