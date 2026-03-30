import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import BulkDeleteDialog, { BulkDeleteHeaderCheckbox, BulkDeleteRowCheckbox, useBulkDeleteSelection } from "@/components/shared/table/BulkDeleteDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Finance/ArusKas/Form";
import ReconcileForm from "@/Pages/Finance/ArusKas/ReconcileForm";

export default function Index({ entries, rekonsiliasi, summary, filters, flashMessage }) {
    const endpoint = "/finance/arus-kas";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [openReconcile, setOpenReconcile] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (entries?.data ?? []).length > 0;
    const currentRows = (entries?.data ?? []);
    const bulkDelete = useBulkDeleteSelection(endpoint, currentRows);

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        router.get(endpoint, {
            search: (formData.get("search") || "").toString(),
            date_from: (formData.get("date_from") || "").toString() || undefined,
            date_to: (formData.get("date_to") || "").toString() || undefined,
            jenis_akun: (formData.get("jenis_akun") || "").toString() || undefined,
        }, { preserveState: true, replace: true });
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus jurnal ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Arus Kas">
            <Head title="Arus Kas" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Finance</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Arus Kas</h1>
                            <p className="mt-1 text-sm text-slate-600">Jurnal otomatis POS/Penggajian, jurnal manual, dan rekonsiliasi kas/bank.</p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={openReconcile} onOpenChange={setOpenReconcile}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">Rekonsiliasi</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Rekonsiliasi Kas/Bank</DialogTitle>
                                        <DialogDescription>Input saldo aktual untuk mencocokkan saldo sistem.</DialogDescription>
                                    </DialogHeader>
                                    <ReconcileForm endpoint={endpoint} onSuccess={() => setOpenReconcile(false)} onCancel={() => setOpenReconcile(false)} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button>Tambah Jurnal Manual</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Jurnal Manual</DialogTitle>
                                        <DialogDescription>Catat transaksi kas/bank manual.</DialogDescription>
                                    </DialogHeader>
                                    <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Masuk</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary?.total_masuk ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Keluar</p><p className="mt-2 text-2xl font-semibold text-rose-700">{formatIDR(summary?.total_keluar ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Saldo Bersih</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatIDR(summary?.saldo_bersih ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Saldo Kas</p><p className="mt-2 text-2xl font-semibold text-cyan-700">{formatIDR(summary?.saldo_kas ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Saldo Bank</p><p className="mt-2 text-2xl font-semibold text-indigo-700">{formatIDR(summary?.saldo_bank ?? 0)}</p></div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <form onSubmit={submitSearch} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
                        <input type="text" name="search" defaultValue={searchValue} placeholder="Cari referensi/deskripsi/kategori" className="h-10 rounded-lg border px-3 text-sm" />
                        <input type="date" name="date_from" defaultValue={filters?.date_from ?? ""} className="h-10 rounded-lg border px-3 text-sm" />
                        <input type="date" name="date_to" defaultValue={filters?.date_to ?? ""} className="h-10 rounded-lg border px-3 text-sm" />
                        <div className="flex gap-2">
                            <select name="jenis_akun" defaultValue={filters?.jenis_akun ?? ""} className="h-10 w-full rounded-lg border px-3 text-sm">
                                <option value="">Semua Akun</option>
                                <option value="kas">Kas</option>
                                <option value="bank">Bank</option>
                            </select>
                            <Button type="submit">Filter</Button>
                        </div>
                    </form>

                    <TableToolbar searchValue={searchValue} searchPlaceholder="Cari data" onSubmit={submitSearch} flashMessage={flashMessage?.success}
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Ref</TableHead>
                                <TableHead>Akun</TableHead>
                                <TableHead>Arus</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Nominal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? entries.data.map((item) => (
                                <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                    <TableCell>{item.tanggal}</TableCell>
                                    <TableCell>{item.referensi_kode || "-"}</TableCell>
                                    <TableCell>{item.jenis_akun}</TableCell>
                                    <TableCell>{item.jenis_arus === "in" ? "Masuk" : "Keluar"}</TableCell>
                                    <TableCell>{item.kategori || "-"}</TableCell>
                                    <TableCell>{formatIDR(item.nominal)}</TableCell>
                                    <TableCell>
                                        <POSStatusBadge status={item.rekonsiliasi_status === "reconciled" ? "aktif" : "warning"} label={item.is_system ? `${item.status} / sistem` : item.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!item.is_system ? (
                                            <div className="flex justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm">Edit</Button></DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader><DialogTitle>Edit Jurnal</DialogTitle><DialogDescription>Perbarui jurnal manual.</DialogDescription></DialogHeader>
                                                        <Form mode="edit" endpoint={endpoint} initialValues={item} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>Hapus</Button>
                                            </div>
                                        ) : <span className="text-xs text-slate-500">Auto</span>}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Belum ada data arus kas.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Riwayat Rekonsiliasi</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Akun</TableHead>
                                <TableHead>Saldo Sistem</TableHead>
                                <TableHead>Saldo Aktual</TableHead>
                                <TableHead>Selisih</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(rekonsiliasi?.data ?? []).length > 0 ? rekonsiliasi.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.tanggal}</TableCell>
                                    <TableCell>{item.jenis_akun}</TableCell>
                                    <TableCell>{formatIDR(item.saldo_sistem)}</TableCell>
                                    <TableCell>{formatIDR(item.saldo_aktual)}</TableCell>
                                    <TableCell>{formatIDR(item.selisih)}</TableCell>
                                    <TableCell><POSStatusBadge status={item.status === "match" ? "aktif" : "warning"} label={item.status} /></TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Belum ada rekonsiliasi.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </section>
            </div>
        </DashboardLayout>
    );
}
