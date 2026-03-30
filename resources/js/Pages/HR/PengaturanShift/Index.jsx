import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useState } from "react";

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
import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/HR/PengaturanShift/Form";

export default function Index({ shiftSettings, filters, flashMessage }) {
    const endpoint = "/hr/pengaturan-shift";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (shiftSettings?.data ?? []).length > 0;
    const currentRows = (shiftSettings?.data ?? []);
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
        if (!window.confirm("Hapus pengaturan shift ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Pengaturan Shift">
            <Head title="Pengaturan Shift" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Penjadwalan</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Pengaturan Shift</h1>
                            <p className="mt-1 text-sm text-slate-600">Atur jam kerja, toleransi, geofence, dan kebijakan verifikasi wajah.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Shift</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Pengaturan Shift</DialogTitle>
                                    <DialogDescription>Definisikan shift kerja untuk kebutuhan penjadwalan dan absensi mobile.</DialogDescription>
                                </DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari nama atau kode shift"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Kode</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Jam</TableHead>
                                <TableHead>Geofence</TableHead>
                                <TableHead>Wajah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                shiftSettings.data.map((item) => (
                                    <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell>{item.jam_masuk} - {item.jam_keluar}</TableCell>
                                        <TableCell>{item.require_location_validation ? `${item.radius_meter} m` : "Nonaktif"}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.require_face_verification ? "aktif" : "nonaktif"} label={item.require_face_verification ? "Wajib" : "Opsional"} />
                                        </TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.is_active ? "aktif" : "nonaktif"} label={item.is_active ? "Aktif" : "Nonaktif"} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Pengaturan Shift</DialogTitle>
                                                            <DialogDescription>Perbarui konfigurasi shift dan validasi absensi.</DialogDescription>
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
                                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Belum ada pengaturan shift.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={shiftSettings?.meta?.current_page ?? 1}
                        lastPage={shiftSettings?.meta?.last_page ?? 1}
                        total={shiftSettings?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
