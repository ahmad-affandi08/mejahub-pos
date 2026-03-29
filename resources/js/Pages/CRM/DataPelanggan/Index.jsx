import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("id-ID") : "-");

export default function Index({ pelanggan, filters, flashMessage }) {
    const endpoint = "/crm/data-pelanggan";
    const searchValue = filters?.search ?? "";
    const rows = pelanggan?.data ?? [];
    const hasData = rows.length > 0;
    const currentPage = pelanggan?.meta?.current_page ?? 1;
    const lastPage = pelanggan?.meta?.last_page ?? 1;
    const total = pelanggan?.meta?.total ?? 0;

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
        <DashboardLayout title="Data Pelanggan">
            <Head title="Data Pelanggan" />
            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">CRM</p>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Data Pelanggan</h1>
                    <p className="mt-2 text-sm text-slate-600">Ringkasan pelanggan berdasarkan histori transaksi POS.</p>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari nama pelanggan atau kode pesanan"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Pelanggan</TableHead>
                                <TableHead>Total Transaksi</TableHead>
                                <TableHead>Total Belanja</TableHead>
                                <TableHead>Transaksi Terakhir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                rows.map((item, index) => (
                                    <TableRow key={`${item.nama_pelanggan}-${index}`}>
                                        <TableCell className="font-medium">{item.nama_pelanggan}</TableCell>
                                        <TableCell>{item.total_transaksi}</TableCell>
                                        <TableCell>{formatIDR(item.total_belanja)}</TableCell>
                                        <TableCell>{formatDateTime(item.terakhir_transaksi)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data pelanggan dari transaksi POS.
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
