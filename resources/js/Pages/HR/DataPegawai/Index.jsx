import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/HR/DataPegawai/Form";
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
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Index({ pegawai, filters, flashMessage }) {
    const endpoint = "/hr/data-pegawai";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (pegawai?.data ?? []).length > 0;
    const currentRows = (pegawai?.data ?? []);
    const bulkDelete = useBulkDeleteSelection(endpoint, currentRows);

    const badgeClass = useMemo(
        () => ({
            aktif: "bg-emerald-100 text-emerald-700",
            nonaktif: "bg-rose-100 text-rose-700",
        }),
        []
    );

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
        if (!window.confirm("Hapus data pegawai ini?")) return;
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
        <DashboardLayout title="Data Pegawai">
            <Head title="Data Pegawai" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Master</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Data Pegawai</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Kelola data pegawai dan akun autentikasi (users) dalam satu layar.
                            </p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Pegawai</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Data Pegawai</DialogTitle>
                                    <DialogDescription>
                                        Isi profil pegawai. Email dan password bersifat opsional, isi jika pegawai membutuhkan akun login.
                                    </DialogDescription>
                                </DialogHeader>

                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    onSuccess={() => setOpenCreate(false)}
                                    onCancel={() => setOpenCreate(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
                            <Input name="search" defaultValue={searchValue} placeholder="Cari nama, no_identitas, atau jabatan" />
                            <Button variant="outline" type="submit">Cari</Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <BulkDeleteDialog endpoint={endpoint} items={currentRows} />
                            {flashMessage?.success ? (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {flashMessage.success}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>No Identitas</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Email Auth</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                pegawai.data.map((item) => (
                                    <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                        <TableCell>{item.no_identitas || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell>{item.jabatan || "-"}</TableCell>
                                        <TableCell>{item.email || "-"}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    item.is_active ? badgeClass.aktif : badgeClass.nonaktif
                                                }`}
                                            >
                                                {item.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog
                                                    open={editingItem?.id === item.id}
                                                    onOpenChange={(open) => {
                                                        setEditingItem(open ? item : null);
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Data Pegawai</DialogTitle>
                                                            <DialogDescription>
                                                                Perbarui data pegawai dan akun autentikasinya.
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <Form
                                                            mode="edit"
                                                            endpoint={endpoint}
                                                            initialValues={item}
                                                            onSuccess={() => setEditingItem(null)}
                                                            onCancel={() => setEditingItem(null)}
                                                        />
                                                    </DialogContent>
                                                </Dialog>

                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data pegawai.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={pegawai?.meta?.current_page ?? 1}
                        lastPage={pegawai?.meta?.last_page ?? 1}
                        total={pegawai?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
