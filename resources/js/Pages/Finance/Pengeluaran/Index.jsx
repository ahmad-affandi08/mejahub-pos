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
import Form from "@/Pages/Finance/Pengeluaran/Form";

export default function Index({ pengeluaran, summary, categoryOptions, filters, flashMessage }) {
    const endpoint = "/finance/pengeluaran";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [quickActionKey, setQuickActionKey] = useState("");

    const hasData = (pengeluaran?.data ?? []).length > 0;
    const currentRows = (pengeluaran?.data ?? []);
    const bulkDelete = useBulkDeleteSelection(endpoint, currentRows);

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        router.get(endpoint, {
            search: (formData.get("search") || "").toString(),
            status: (formData.get("status") || "").toString() || undefined,
        }, { preserveState: true, replace: true });
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus data pengeluaran ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    const runQuickAction = (id, action) => {
        const labels = {
            submit: "Submit",
            approve: "Approve",
            reject: "Reject",
        };

        if (!window.confirm(`${labels[action]} data ini?`)) return;

        const actionKey = `${id}:${action}`;
        setQuickActionKey(actionKey);

        router.put(`${endpoint}/${id}`, {
            quick_action: true,
            action,
        }, {
            preserveScroll: true,
            onFinish: () => setQuickActionKey(""),
        });
    };

    const isActionLoading = (id, action) => quickActionKey === `${id}:${action}`;
    const isAnyActionLoading = quickActionKey !== "";

    const actionButtons = (item) => {
        if (item.status_approval === "draft" || item.status_approval === "rejected") {
            return (
                <Button size="sm" variant="secondary" disabled={isAnyActionLoading} onClick={() => runQuickAction(item.id, "submit")}>
                    {isActionLoading(item.id, "submit") ? "Submitting..." : "Submit"}
                </Button>
            );
        }

        if (item.status_approval === "submitted") {
            return (
                <>
                    <Button size="sm" disabled={isAnyActionLoading} onClick={() => runQuickAction(item.id, "approve")}>
                        {isActionLoading(item.id, "approve") ? "Approving..." : "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={isAnyActionLoading} onClick={() => runQuickAction(item.id, "reject")}>
                        {isActionLoading(item.id, "reject") ? "Rejecting..." : "Reject"}
                    </Button>
                </>
            );
        }

        if (item.status_approval === "approved") {
            return (
                <Button size="sm" variant="outline" disabled={isAnyActionLoading} onClick={() => runQuickAction(item.id, "reject")}>
                    {isActionLoading(item.id, "reject") ? "Rejecting..." : "Reject"}
                </Button>
            );
        }

        return null;
    };

    return (
        <DashboardLayout title="Pengeluaran">
            <Head title="Pengeluaran" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Finance</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Pengeluaran Operasional</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola kategori biaya operasional dengan approval flow sederhana.</p>
                        </div>
                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild><Button>Tambah Pengeluaran</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader><DialogTitle>Tambah Pengeluaran</DialogTitle><DialogDescription>Input pengeluaran operasional.</DialogDescription></DialogHeader>
                                <Form mode="create" endpoint={endpoint} initialValues={null} categoryOptions={categoryOptions} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Total Approved</p><p className="mt-2 text-2xl font-semibold text-rose-700">{formatIDR(summary?.total_pengeluaran ?? 0)}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Draft</p><p className="mt-2 text-2xl font-semibold text-slate-900">{summary?.draft_count ?? 0}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Submitted</p><p className="mt-2 text-2xl font-semibold text-amber-600">{summary?.submitted_count ?? 0}</p></div>
                    <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-widest text-slate-500">Approved</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{summary?.approved_count ?? 0}</p></div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <form onSubmit={submitSearch} className="mb-3 flex gap-2">
                        <input type="text" name="search" defaultValue={searchValue} placeholder="Cari kode/kategori/deskripsi/vendor" className="h-10 w-full rounded-lg border px-3 text-sm" />
                        <select name="status" defaultValue={filters?.status ?? ""} className="h-10 rounded-lg border px-3 text-sm">
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </form>

                    <TableToolbar searchValue={searchValue} searchPlaceholder="Cari data" onSubmit={submitSearch} flashMessage={flashMessage?.success} 
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Kode</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Metode</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Nominal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? pengeluaran.data.map((item) => (
                                <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                    <TableCell>{item.kode}</TableCell>
                                    <TableCell>{item.tanggal}</TableCell>
                                    <TableCell>{item.kategori_biaya}</TableCell>
                                    <TableCell>{item.metode_pembayaran}</TableCell>
                                    <TableCell>{item.deskripsi}</TableCell>
                                    <TableCell>{formatIDR(item.nominal)}</TableCell>
                                    <TableCell><POSStatusBadge status={item.status_approval === "approved" ? "aktif" : item.status_approval === "rejected" ? "nonaktif" : "warning"} label={item.status_approval} /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {actionButtons(item)}
                                            <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                <DialogTrigger asChild><Button variant="outline" size="sm">Edit/Approval</Button></DialogTrigger>
                                                <DialogContent className="sm:max-w-xl">
                                                    <DialogHeader><DialogTitle>Edit Pengeluaran</DialogTitle><DialogDescription>Perbarui dan proses approval.</DialogDescription></DialogHeader>
                                                    <Form mode="edit" endpoint={endpoint} initialValues={item} categoryOptions={categoryOptions} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                </DialogContent>
                                            </Dialog>
                                            <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Belum ada data pengeluaran.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </section>
            </div>
        </DashboardLayout>
    );
}
