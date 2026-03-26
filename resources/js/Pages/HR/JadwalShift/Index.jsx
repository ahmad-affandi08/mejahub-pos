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
import Form from "@/Pages/HR/JadwalShift/Form";
import GenerateForm from "@/Pages/HR/JadwalShift/GenerateForm";

export default function Index({ jadwalShift, pegawaiOptions, shiftOptions, filters, flashMessage }) {
    const endpoint = "/hr/jadwal-shift";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [openGenerate, setOpenGenerate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (jadwalShift?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus jadwal shift ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Jadwal Shift">
            <Head title="Jadwal Shift" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Penjadwalan</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Jadwal Shift</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola jadwal manual dan generate jadwal massal berdasarkan tanggal dan hari kerja.</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Dialog open={openGenerate} onOpenChange={setOpenGenerate}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">Generate Jadwal</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Generate Jadwal Shift</DialogTitle>
                                        <DialogDescription>Buat jadwal otomatis untuk banyak pegawai berdasarkan jabatan, tanggal, dan hari kerja.</DialogDescription>
                                    </DialogHeader>
                                    <GenerateForm endpoint={endpoint} pegawaiOptions={pegawaiOptions} onSuccess={() => setOpenGenerate(false)} onCancel={() => setOpenGenerate(false)} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button>Tambah Jadwal</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Jadwal Shift</DialogTitle>
                                        <DialogDescription>Input jadwal shift harian per pegawai.</DialogDescription>
                                    </DialogHeader>
                                    <Form mode="create" endpoint={endpoint} initialValues={null} pegawaiOptions={pegawaiOptions} shiftOptions={shiftOptions} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari kode, pegawai, shift, status, tanggal"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.error ?? flashMessage?.success}
                        flashType={flashMessage?.error ? "error" : "success"}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sumber</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                jadwalShift.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.pegawai_nama || "-"}</TableCell>
                                        <TableCell>{item.shift_nama || "-"}</TableCell>
                                        <TableCell>{item.tanggal || "-"}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.status === "published" ? "aktif" : item.status === "libur" ? "nonaktif" : "warning"} label={item.status} />
                                        </TableCell>
                                        <TableCell>{item.sumber_jadwal}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Jadwal Shift</DialogTitle>
                                                            <DialogDescription>Perbarui penjadwalan shift pegawai.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form mode="edit" endpoint={endpoint} initialValues={item} pegawaiOptions={pegawaiOptions} shiftOptions={shiftOptions} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada jadwal shift.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {jadwalShift.meta.current_page} dari {jadwalShift.meta.last_page} | Total {jadwalShift.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={jadwalShift.meta.current_page <= 1} onClick={() => goPage(jadwalShift.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={jadwalShift.meta.current_page >= jadwalShift.meta.last_page} onClick={() => goPage(jadwalShift.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
