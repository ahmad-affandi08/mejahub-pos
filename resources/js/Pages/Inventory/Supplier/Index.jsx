import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
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
import Form from "@/Pages/Inventory/Supplier/Form";

export default function Index({ suppliers, filters, flashMessage }) {
    const endpoint = "/inventory/supplier";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (suppliers?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus supplier ini?")) return;
        const normalizedId = String(id ?? "").trim();

        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, { id: normalizedId }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Supplier">
            <Head title="Supplier" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Supplier</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola data pemasok bahan baku.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Supplier</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Supplier</DialogTitle>
                                    <DialogDescription>Lengkapi data supplier lalu simpan.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
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
                        searchPlaceholder="Cari nama, kode, telepon, email"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kontak PIC</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    suppliers.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode || "-"}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell>{item.kontak_pic || "-"}</TableCell>
                                            <TableCell>{item.telepon || "-"}</TableCell>
                                            <TableCell>{item.email || "-"}</TableCell>
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
                                                        <DialogContent className="sm:max-w-xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Supplier</DialogTitle>
                                                                <DialogDescription>Perbarui data supplier.</DialogDescription>
                                                            </DialogHeader>
                                                            <Form
                                                                mode="edit"
                                                                endpoint={endpoint}
                                                                initialValues={item}
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
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada supplier.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationSelect
                        currentPage={suppliers?.meta?.current_page ?? 1}
                        lastPage={suppliers?.meta?.last_page ?? 1}
                        total={suppliers?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
