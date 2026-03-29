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
import Form from "@/Pages/Settings/MetodePembayaran/Form";

export default function Index({ metodePembayaran, filters, flashMessage }) {
    const endpoint = "/settings/metode-pembayaran";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (metodePembayaran?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus metode pembayaran ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Metode Pembayaran">
            <Head title="Metode Pembayaran" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Settings</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Metode Pembayaran</h1>
                            <p className="mt-1 text-sm text-slate-600">Atur kanal pembayaran yang tersedia di POS.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Metode</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
                                    <DialogDescription>Isi detail metode pembayaran.</DialogDescription>
                                </DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar searchValue={searchValue} searchPlaceholder="Cari kode, nama, tipe, provider" onSubmit={submitSearch} flashMessage={flashMessage?.success} />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    metodePembayaran.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell>{item.tipe}</TableCell>
                                            <TableCell>{item.provider || "-"}</TableCell>
                                            <TableCell>
                                                <POSStatusBadge status={item.is_default ? "aktif" : "nonaktif"} label={item.is_default ? "Default" : "No"} />
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
                                                                <DialogTitle>Edit Metode Pembayaran</DialogTitle>
                                                                <DialogDescription>Perbarui detail metode pembayaran.</DialogDescription>
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
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada metode pembayaran.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationSelect
                        currentPage={metodePembayaran?.meta?.current_page ?? 1}
                        lastPage={metodePembayaran?.meta?.last_page ?? 1}
                        total={metodePembayaran?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
