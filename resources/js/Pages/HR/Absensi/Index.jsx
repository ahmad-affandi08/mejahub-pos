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
import Form from "@/Pages/HR/Absensi/Form";

export default function Index({ absensi, pegawaiOptions, filters, flashMessage }) {
    const endpoint = "/hr/absensi";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (absensi?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus data absensi ini?")) return;

        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Absensi">
            <Head title="Absensi" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Operasional</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Absensi</h1>
                            <p className="mt-1 text-sm text-slate-600">Pantau kehadiran harian pegawai dengan status yang terstruktur.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Absensi</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Data Absensi</DialogTitle>
                                    <DialogDescription>Isi data kehadiran pegawai sesuai tanggal operasional.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    pegawaiOptions={pegawaiOptions}
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
                        searchPlaceholder="Cari kode, nama pegawai, status, atau tanggal"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Jam</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aktif</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                absensi.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.pegawai_nama || "-"}</TableCell>
                                        <TableCell>{item.tanggal || "-"}</TableCell>
                                        <TableCell>{`${item.jam_masuk || "-"} s/d ${item.jam_keluar || "-"}`}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.status === "hadir" ? "aktif" : "warning"} label={item.status} />
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
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Data Absensi</DialogTitle>
                                                            <DialogDescription>Perbarui data absensi pegawai.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form
                                                            mode="edit"
                                                            endpoint={endpoint}
                                                            initialValues={item}
                                                            pegawaiOptions={pegawaiOptions}
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
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data absensi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={absensi?.meta?.current_page ?? 1}
                        lastPage={absensi?.meta?.last_page ?? 1}
                        total={absensi?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
