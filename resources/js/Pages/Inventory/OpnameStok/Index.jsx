import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Inventory/OpnameStok/Form";

export default function Index({ opnameStok, bahanBakuOptions, filters, flashMessage }) {
    const endpoint = "/inventory/opname-stok";
    const searchValue = filters?.search ?? "";
    const [openCreate, setOpenCreate] = useState(false);

    const hasData = (opnameStok?.data ?? []).length > 0;

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();

        router.get(endpoint, { search }, { preserveState: true, replace: true });
    };

    const goPage = (page) => {
        router.get(endpoint, { search: searchValue, page }, { preserveState: true });
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus data opname ini? Stok akan dikembalikan ke stok sistem saat opname.")) return;

        const normalizedId = String(id ?? "").trim();
        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, { id: normalizedId }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Opname Stok">
            <Head title="Opname Stok" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Opname Stok</h1>
                            <p className="mt-1 text-sm text-slate-600">Sesuaikan stok sistem dengan stok fisik lapangan.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Opname</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Opname Stok</DialogTitle>
                                    <DialogDescription>Input stok fisik aktual untuk bahan baku.</DialogDescription>
                                </DialogHeader>
                                <Form endpoint={endpoint} bahanBakuOptions={bahanBakuOptions} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar searchValue={searchValue} searchPlaceholder="Cari kode opname atau bahan" onSubmit={submitSearch} flashMessage={flashMessage?.success} />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Bahan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Stok Sistem</TableHead>
                                    <TableHead>Stok Fisik</TableHead>
                                    <TableHead>Selisih</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    opnameStok.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.kode}</TableCell>
                                            <TableCell>{item.bahan_baku_nama}</TableCell>
                                            <TableCell>{item.tanggal_opname || "-"}</TableCell>
                                            <TableCell>{item.stok_sistem}</TableCell>
                                            <TableCell>{item.stok_fisik}</TableCell>
                                            <TableCell>{item.selisih}</TableCell>
                                            <TableCell><POSStatusBadge status={item.status} /></TableCell>
                                            <TableCell className="text-right"><Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Belum ada data opname stok.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {opnameStok.meta.current_page} dari {opnameStok.meta.last_page} | Total {opnameStok.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={opnameStok.meta.current_page <= 1} onClick={() => goPage(opnameStok.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={opnameStok.meta.current_page >= opnameStok.meta.last_page} onClick={() => goPage(opnameStok.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
