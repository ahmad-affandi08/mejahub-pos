import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Meja/AreaMeja/Form";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import TableToolbar from "@/components/shared/table/TableToolbar";
import BulkDeleteDialog, { BulkDeleteHeaderCheckbox, BulkDeleteRowCheckbox, useBulkDeleteSelection } from "@/components/shared/table/BulkDeleteDialog";
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

export default function Index({ areaMeja, filters, flashMessage }) {
    const endpoint = "/meja/area-meja";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (areaMeja?.data ?? []).length > 0;
    const currentRows = (areaMeja?.data ?? []);
    const bulkDelete = useBulkDeleteSelection(endpoint, currentRows);

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
        if (!window.confirm("Hapus area meja ini?")) return;
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
        <DashboardLayout title="Area Meja">
            <Head title="Area Meja" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Meja Master</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Area Meja</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola pengelompokan area meja restoran.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Area</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Area Meja</DialogTitle>
                                    <DialogDescription>Isi data area meja baru.</DialogDescription>
                                </DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari nama atau kode area"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Urutan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                areaMeja.data.map((item) => (
                                    <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell>{item.deskripsi || "-"}</TableCell>
                                        <TableCell>{item.urutan}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.is_active ? "aktif" : "nonaktif"} label={item.is_active ? "Aktif" : "Nonaktif"} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Area Meja</DialogTitle>
                                                            <DialogDescription>Perbarui data area meja.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form mode="edit" endpoint={endpoint} initialValues={item} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada area meja.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={areaMeja?.meta?.current_page ?? 1}
                        lastPage={areaMeja?.meta?.last_page ?? 1}
                        total={areaMeja?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
