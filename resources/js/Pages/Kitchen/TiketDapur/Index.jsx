import { Head, router } from "@inertiajs/react";

import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("id-ID") : "-");

export default function Index({ tiketDapur, filters, flashMessage }) {
    const endpoint = "/kitchen/tiket-dapur";
    const searchValue = filters?.search ?? "";
    const rows = tiketDapur?.data ?? [];
    const hasData = rows.length > 0;
    const currentPage = tiketDapur?.meta?.current_page ?? 1;
    const lastPage = tiketDapur?.meta?.last_page ?? 1;
    const total = tiketDapur?.meta?.total ?? 0;

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
        <DashboardLayout title="Tiket Dapur">
            <Head title="Tiket Dapur" />
            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Kitchen</p>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Tiket Dapur</h1>
                    <p className="mt-2 text-sm text-slate-600">Antrian tiket pesanan yang perlu diproses dapur.</p>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari kode pesanan, pelanggan, atau menu"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode Pesanan</TableHead>
                                <TableHead>Pelanggan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total Item</TableHead>
                                <TableHead>Total Qty</TableHead>
                                <TableHead>Waktu Pesan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                rows.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.kode}</TableCell>
                                        <TableCell>{item.nama_pelanggan || "Walk-in"}</TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>{item.total_item}</TableCell>
                                        <TableCell>{item.total_qty}</TableCell>
                                        <TableCell>{formatDateTime(item.waktu_pesan)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada tiket dapur aktif.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {currentPage} dari {lastPage} | Total {total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => goPage(currentPage - 1)}>
                                Sebelumnya
                            </Button>
                            <Button variant="outline" size="sm" disabled={currentPage >= lastPage} onClick={() => goPage(currentPage + 1)}>
                                Berikutnya
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
