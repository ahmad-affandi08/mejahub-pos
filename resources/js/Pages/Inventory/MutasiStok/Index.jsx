import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index({ mutasiStok, filters, flashMessage }) {
    const endpoint = "/inventory/mutasi-stok";
    const searchValue = filters?.search ?? "";
    const hasData = (mutasiStok?.data ?? []).length > 0;
    const currentPage = mutasiStok?.meta?.current_page ?? 1;
    const lastPage = mutasiStok?.meta?.last_page ?? 1;
    const total = mutasiStok?.meta?.total ?? 0;

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
        <DashboardLayout title="Mutasi Stok">
            <Head title="Mutasi Stok" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Inventory</p>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Mutasi Stok</h1>
                    <p className="mt-1 text-sm text-slate-600">Log mutasi stok otomatis dari berbagai transaksi sistem.</p>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari referensi, bahan baku, user, atau lokasi"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Bahan Baku</TableHead>
                                <TableHead>Arah</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Stok</TableHead>
                                <TableHead>Referensi</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                mutasiStok.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.occurred_at || "-"}</TableCell>
                                        <TableCell>{item.bahan_baku_nama || "-"}</TableCell>
                                        <TableCell>{item.direction || "-"}</TableCell>
                                        <TableCell>{item.qty}</TableCell>
                                        <TableCell>{item.stok_sebelum ?? "-"}{" -> "}{item.stok_sesudah ?? "-"}</TableCell>
                                        <TableCell>{item.reference_code || "-"}</TableCell>
                                        <TableCell>{item.user_name || "System"}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data mutasi stok.
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
