import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
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

export default function DetailResep({ menu, resepItems, menuOptions, bahanBakuOptions, backFilters, flashMessage }) {
    const endpoint = "/inventory/resep-b-o-m";
    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const goBack = () => {
        router.get(
            endpoint,
            {
                search: backFilters?.search || undefined,
                kategori_menu_id: backFilters?.kategori_menu_id || undefined,
                page: backFilters?.page || undefined,
            },
            { preserveState: true }
        );
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus bahan resep ini?")) return;
        router.post(`${endpoint}/delete`, { id }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Detail Resep BOM">
            <Head title={`Detail Resep - ${menu?.nama || "Menu"}`} />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{menu?.nama || "Menu"}</h1>
                            <p className="mt-1 text-sm text-slate-600">Kategori: {menu?.kategori_nama || "Tanpa kategori"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button>Tambah Bahan</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Bahan Resep</DialogTitle>
                                        <DialogDescription>Tambahkan satu atau beberapa bahan sekaligus untuk menu ini.</DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        mode="create"
                                        endpoint={endpoint}
                                        initialValues={{ data_menu_id: menu?.id }}
                                        menuOptions={menuOptions}
                                        bahanBakuOptions={bahanBakuOptions}
                                        onSuccess={() => setOpenCreate(false)}
                                        onCancel={() => setOpenCreate(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" onClick={goBack}>Kembali ke List</Button>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    {flashMessage?.success ? (
                        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flashMessage.success}</p>
                    ) : null}

                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Detail Resep</h2>

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Bahan Baku</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead>Porsi Ref.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(resepItems ?? []).length > 0 ? (
                                    resepItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.kode}</TableCell>
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
                                                                <DialogTitle>Edit Bahan Resep</DialogTitle>
                                                                <DialogDescription>Perbarui data bahan untuk menu ini.</DialogDescription>
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
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada bahan untuk menu ini.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
