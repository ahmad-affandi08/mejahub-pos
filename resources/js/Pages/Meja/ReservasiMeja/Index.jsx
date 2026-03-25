import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Meja/ReservasiMeja/Form";
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

function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function Index({ reservasiMeja, mejaOptions, statusOptions, filters, flashMessage }) {
    const endpoint = "/meja/reservasi-meja";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (reservasiMeja?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus reservasi meja ini?")) return;
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

    const statusLabel = (value) => statusOptions.find((item) => item.value === value)?.label ?? value;

    return (
        <DashboardLayout title="Reservasi Meja">
            <Head title="Reservasi Meja" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Meja Operasional</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Reservasi Meja</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola jadwal reservasi pelanggan.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Reservasi</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Reservasi Meja</DialogTitle>
                                    <DialogDescription>Isi data reservasi pelanggan dan meja tujuan.</DialogDescription>
                                </DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} mejaOptions={mejaOptions} statusOptions={statusOptions} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari nama pelanggan, kode, atau no hp"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Meja</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Tamu</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    reservasiMeja.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode || "-"}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{item.nama_pelanggan}</p>
                                                <p className="text-xs text-muted-foreground">{item.no_hp || "-"}</p>
                                            </TableCell>
                                            <TableCell>{item.meja_nama || "-"} {item.meja_nomor ? `(${item.meja_nomor})` : ""}</TableCell>
                                            <TableCell>{formatDateTime(item.waktu_reservasi)}</TableCell>
                                            <TableCell>{item.jumlah_tamu}</TableCell>
                                            <TableCell>
                                                <POSStatusBadge status={item.status} label={statusLabel(item.status)} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">Edit</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Reservasi Meja</DialogTitle>
                                                                <DialogDescription>Perbarui data reservasi.</DialogDescription>
                                                            </DialogHeader>
                                                            <Form mode="edit" endpoint={endpoint} initialValues={item} mejaOptions={mejaOptions} statusOptions={statusOptions} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada reservasi meja.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {reservasiMeja.meta.current_page} dari {reservasiMeja.meta.last_page} | Total {reservasiMeja.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={reservasiMeja.meta.current_page <= 1} onClick={() => goPage(reservasiMeja.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={reservasiMeja.meta.current_page >= reservasiMeja.meta.last_page} onClick={() => goPage(reservasiMeja.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
