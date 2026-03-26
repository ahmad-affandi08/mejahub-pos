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
import Form from "@/Pages/Inventory/ResepBOM/Form";

export default function Index({ resepBOM, menuOptions, bahanBakuOptions, filters, flashMessage }) {
    const endpoint = "/inventory/resep-b-o-m";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (resepBOM?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus data Resep BOM ini?")) return;

        const normalizedId = String(id ?? "").trim();
        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, { id: normalizedId }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Resep BOM">
            <Head title="Resep BOM" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Resep BOM</h1>
                            <p className="mt-1 text-sm text-slate-600">Definisikan kebutuhan bahan baku untuk setiap menu.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Resep BOM</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Resep BOM</DialogTitle>
                                    <DialogDescription>Isi bahan baku dan qty kebutuhan per menu.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    menuOptions={menuOptions}
                                    bahanBakuOptions={bahanBakuOptions}
                                    onSuccess={() => setOpenCreate(false)}
                                    onCancel={() => setOpenCreate(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari kode, menu, atau bahan baku"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Menu</TableHead>
                                    <TableHead>Bahan Baku</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead>Porsi Ref.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    resepBOM.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.kode}</TableCell>
                                            <TableCell>{item.menu_nama}</TableCell>
                                            <TableCell>{item.bahan_baku_nama}</TableCell>
                                            <TableCell>{item.qty_kebutuhan}</TableCell>
                                            <TableCell>{item.satuan || "-"}</TableCell>
                                            <TableCell>{item.referensi_porsi}</TableCell>
                                            <TableCell>
                                                <POSStatusBadge
                                                    status={item.is_active ? "aktif" : "nonaktif"}
                                                    label={item.is_active ? "Aktif" : "Nonaktif"}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">Edit</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Resep BOM</DialogTitle>
                                                                <DialogDescription>Perbarui data resep BOM.</DialogDescription>
                                                            </DialogHeader>
                                                            <Form
                                                                mode="edit"
                                                                endpoint={endpoint}
                                                                initialValues={item}
                                                                menuOptions={menuOptions}
                                                                bahanBakuOptions={bahanBakuOptions}
                                                                onSuccess={() => setEditingItem(null)}
                                                                onCancel={() => setEditingItem(null)}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Belum ada data resep BOM.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {resepBOM.meta.current_page} dari {resepBOM.meta.last_page} | Total {resepBOM.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={resepBOM.meta.current_page <= 1} onClick={() => goPage(resepBOM.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={resepBOM.meta.current_page >= resepBOM.meta.last_page} onClick={() => goPage(resepBOM.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
