import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useState } from "react";

import { formatIDR } from "@/components/shared/pos/format";
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
import Form from "@/Pages/HR/PengaturanGaji/Form";

export default function Index({ salaryTemplates, pegawaiOptions, filters, flashMessage }) {
    const endpoint = "/hr/pengaturan-gaji";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (salaryTemplates?.data ?? []).length > 0;
    const currentRows = (salaryTemplates?.data ?? []);
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
        if (!window.confirm("Hapus template gaji pegawai ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Pengaturan Gaji Pegawai">
            <Head title="Pengaturan Gaji Pegawai" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Payroll</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Pengaturan Gaji Pegawai</h1>
                            <p className="mt-1 text-sm text-slate-600">Simpan template gaji pokok per karyawan agar generate payroll otomatis tidak perlu input ulang.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Template</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Template Gaji Pegawai</DialogTitle>
                                    <DialogDescription>Satu pegawai hanya boleh memiliki satu template aktif.</DialogDescription>
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
                        searchPlaceholder="Cari pegawai, jabatan, atau catatan"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Gaji Pokok</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Kebijakan Payroll</TableHead>
                                <TableHead>Catatan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                salaryTemplates.data.map((item) => (
                                    <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                        <TableCell className="font-medium">{item.pegawai_nama || "-"}</TableCell>
                                        <TableCell>{item.jabatan || "-"}</TableCell>
                                        <TableCell>{formatIDR(item.gaji_pokok)}</TableCell>
                                        <TableCell>
                                            <POSStatusBadge status={item.is_active ? "aktif" : "nonaktif"} label={item.is_active ? "Aktif" : "Nonaktif"} />
                                        </TableCell>
                                        <TableCell className="max-w-sm text-xs text-slate-600">
                                            {(() => {
                                                const policy = item.kebijakan_penggajian || {};
                                                return [
                                                    `Lembur/jam: ${formatIDR(policy.lembur_per_jam ?? 0)}`,
                                                    `Izin: ${policy.potong_izin ? formatIDR(policy.potongan_per_izin ?? 0) : "Tidak Potong"}`,
                                                    `Sakit: ${policy.potong_sakit ? formatIDR(policy.potongan_per_sakit ?? 0) : "Tidak Potong"}`,
                                                    `Alpha: ${policy.potong_alpha ? formatIDR(policy.potongan_per_alpha ?? 0) : "Tidak Potong"}`,
                                                    `Terlambat: ${policy.potong_terlambat ? formatIDR(policy.potongan_per_terlambat ?? 0) : "Tidak Potong"}`,
                                                ].join(" | ");
                                            })()}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{item.catatan || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Template Gaji Pegawai</DialogTitle>
                                                            <DialogDescription>Perbarui gaji pokok template untuk generate payroll.</DialogDescription>
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
                                        Belum ada template gaji pegawai.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={salaryTemplates?.meta?.current_page ?? 1}
                        lastPage={salaryTemplates?.meta?.last_page ?? 1}
                        total={salaryTemplates?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
