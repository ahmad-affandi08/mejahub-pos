import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Finance/PettyCash/Form";

export default function Index({ pettyCash, summary, filters, flashMessage }) {
    const endpoint = "/finance/petty-cash";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        router.get(endpoint, {
            search: (formData.get("search") || "").toString(),
            status: (formData.get("status") || "").toString() || undefined,
        }, { preserveState: true, replace: true });
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus data petty cash ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Petty Cash">
            <Head title="Petty Cash" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Finance</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Petty Cash</h1>
                            <p className="mt-1 text-sm text-slate-600">Kas kecil operasional dengan approval sederhana dan jurnal otomatis.</p>
                        </div>
                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild><Button>Tambah Petty Cash</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader><DialogTitle>Tambah Petty Cash</DialogTitle><DialogDescription>Input transaksi kas kecil.</DialogDescription></DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Saldo Akhir</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatIDR(summary?.saldo_akhir ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Masuk</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{formatIDR(summary?.total_in ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Keluar</p><p className="mt-2 text-2xl font-semibold text-rose-700">{formatIDR(summary?.total_out ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Submitted</p><p className="mt-2 text-2xl font-semibold text-amber-600">{summary?.submitted_count ?? 0}</p></div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <form onSubmit={submitSearch} className="mb-3 flex gap-2">
                        <input type="text" name="search" defaultValue={searchValue} placeholder="Cari kode/jenis/deskripsi" className="h-10 w-full rounded-lg border px-3 text-sm" />
                        <select name="status" defaultValue={filters?.status ?? ""} className="h-10 rounded-lg border px-3 text-sm">
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </form>

                    <TableToolbar searchValue={searchValue} searchPlaceholder="Cari data" onSubmit={submitSearch} flashMessage={flashMessage?.success} />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Arus</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Nominal</TableHead>
                                <TableHead>Saldo Setelah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(pettyCash?.data ?? []).length > 0 ? pettyCash.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.kode}</TableCell>
                                    <TableCell>{item.tanggal}</TableCell>
                                    <TableCell>{item.jenis_transaksi}</TableCell>
                                    <TableCell>{item.jenis_arus === "in" ? "Masuk" : "Keluar"}</TableCell>
                                    <TableCell>{item.deskripsi}</TableCell>
                                    <TableCell>{formatIDR(item.nominal)}</TableCell>
                                    <TableCell>{formatIDR(item.saldo_setelah)}</TableCell>
                                    <TableCell><POSStatusBadge status={item.status_approval === "approved" ? "aktif" : item.status_approval === "rejected" ? "nonaktif" : "warning"} label={item.status_approval} /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                <DialogTrigger asChild><Button variant="outline" size="sm">Edit/Approval</Button></DialogTrigger>
                                                <DialogContent className="sm:max-w-xl">
                                                    <DialogHeader><DialogTitle>Edit Petty Cash</DialogTitle><DialogDescription>Perbarui data dan approval.</DialogDescription></DialogHeader>
                                                    <Form mode="edit" endpoint={endpoint} initialValues={item} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                </DialogContent>
                                            </Dialog>
                                            <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Belum ada data petty cash.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </section>
            </div>
        </DashboardLayout>
    );
}
