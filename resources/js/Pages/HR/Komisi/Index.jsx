import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import { formatIDR } from "@/components/shared/pos/format";
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
import Form from "@/Pages/HR/Komisi/Form";

export default function Index({ komisi, pegawaiOptions, filters, flashMessage }) {
    const endpoint = "/hr/komisi";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (komisi?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus data komisi ini?")) return;

        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Komisi">
            <Head title="Komisi" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Payroll</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Komisi Pegawai</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola perhitungan dan status pencairan komisi pegawai per periode.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Komisi</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Data Komisi</DialogTitle>
                                    <DialogDescription>Isi data komisi berdasarkan performa atau target periode.</DialogDescription>
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
                        searchPlaceholder="Cari kode, pegawai, periode, atau status"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Periode</TableHead>
                                <TableHead>Dasar</TableHead>
                                <TableHead>Persentase</TableHead>
                                <TableHead>Nominal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                komisi.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.pegawai_nama || "-"}</TableCell>
                                        <TableCell>{item.periode}</TableCell>
                                        <TableCell>{formatIDR(item.dasar_perhitungan)}</TableCell>
                                        <TableCell>{Number(item.persentase || 0).toFixed(2)}%</TableCell>
                                        <TableCell>{formatIDR(item.nominal)}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge
                                                status={item.status === "dibayar" ? "aktif" : item.status === "dibatalkan" ? "nonaktif" : "warning"}
                                                label={item.status}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Data Komisi</DialogTitle>
                                                            <DialogDescription>Perbarui data komisi pegawai.</DialogDescription>
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
                                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data komisi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={komisi?.meta?.current_page ?? 1}
                        lastPage={komisi?.meta?.last_page ?? 1}
                        total={komisi?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
