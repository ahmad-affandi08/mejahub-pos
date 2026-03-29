import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Menu/KategoriMenu/Form";
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

export default function Index({ kategoriMenu, filters, flashMessage }) {
    const endpoint = "/menu/kategori-menu";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (kategoriMenu?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus kategori ini?")) return;

        const normalizedId = String(id ?? "").trim();

        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, {
            id: normalizedId,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout title="Kategori Menu">
            <Head title="Kategori Menu" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Master Data</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Kategori Menu</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Kelola kategori untuk pengelompokan menu di POS.
                            </p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Kategori</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Tambah Kategori Menu</DialogTitle>
                                    <DialogDescription>
                                        Isi data kategori, lalu simpan untuk menambahkan ke master menu.
                                    </DialogDescription>
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
                        searchPlaceholder="Cari nama atau kode kategori"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Urutan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                kategoriMenu.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell>{item.deskripsi || "-"}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.is_active ? "aktif" : "nonaktif"} label={item.is_active ? "Aktif" : "Nonaktif"} />
                                        </TableCell>
                                        <TableCell>{item.urutan}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog
                                                    open={editingItem?.id === item.id}
                                                    onOpenChange={(open) => {
                                                        setEditingItem(open ? item : null);
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Kategori Menu</DialogTitle>
                                                            <DialogDescription>
                                                                Ubah data kategori menu lalu simpan perubahan.
                                                            </DialogDescription>
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

                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada kategori menu.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={kategoriMenu?.meta?.current_page ?? 1}
                        lastPage={kategoriMenu?.meta?.last_page ?? 1}
                        total={kategoriMenu?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
