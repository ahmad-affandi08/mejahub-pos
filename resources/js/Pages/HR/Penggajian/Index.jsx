import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useState } from "react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import { formatIDR } from "@/components/shared/pos/format";
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
import Form from "@/Pages/HR/Penggajian/Form";
import GenerateForm from "@/Pages/HR/Penggajian/GenerateForm";

export default function Index({ penggajian, pegawaiOptions, gajiPokokTemplatePerPegawai, filters, flashMessage }) {
    const endpoint = "/hr/penggajian";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [openGenerate, setOpenGenerate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (penggajian?.data ?? []).length > 0;
    const currentRows = (penggajian?.data ?? []);
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
        if (!window.confirm("Hapus data penggajian ini?")) return;

        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Penggajian">
            <Head title="Penggajian" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Payroll</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Penggajian</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola slip gaji bulanan pegawai lengkap dengan komponen gaji dan status pembayaran.</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Dialog open={openGenerate} onOpenChange={setOpenGenerate}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">Generate Otomatis</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Generate Penggajian Otomatis</DialogTitle>
                                        <DialogDescription>Generate payroll terintegrasi dari rekap absensi karyawan per periode.</DialogDescription>
                                    </DialogHeader>
                                    <GenerateForm
                                        endpoint={endpoint}
                                        pegawaiOptions={pegawaiOptions}
                                        gajiPokokTemplatePerPegawai={gajiPokokTemplatePerPegawai}
                                        onSuccess={() => setOpenGenerate(false)}
                                        onCancel={() => setOpenGenerate(false)}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button>Tambah Penggajian</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Data Penggajian</DialogTitle>
                                        <DialogDescription>Isi komponen penggajian pegawai per periode.</DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        mode="create"
                                        endpoint={endpoint}
                                        initialValues={null}
                                        pegawaiOptions={pegawaiOptions}
                                        gajiPokokTemplatePerPegawai={gajiPokokTemplatePerPegawai}
                                        onSuccess={() => setOpenCreate(false)}
                                        onCancel={() => setOpenCreate(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <TableToolbar
                        searchValue={searchValue}
                        searchPlaceholder="Cari kode, pegawai, periode, atau status"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                <TableHead>Kode</TableHead>
                                <TableHead>Pegawai</TableHead>
                                <TableHead>Periode</TableHead>
                                <TableHead>Tgl Bayar</TableHead>
                                <TableHead>Gaji Pokok</TableHead>
                                <TableHead>Potongan</TableHead>
                                <TableHead>Total Gaji</TableHead>
                                <TableHead>Rekap Absensi</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                penggajian.data.map((item) => (
                                    <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                        <TableCell>{item.kode || "-"}</TableCell>
                                        <TableCell className="font-medium">{item.pegawai_nama || "-"}</TableCell>
                                        <TableCell>{item.periode}</TableCell>
                                        <TableCell>{item.tanggal_pembayaran || "-"}</TableCell>
                                        <TableCell>{formatIDR(item.gaji_pokok)}</TableCell>
                                        <TableCell>{formatIDR(item.potongan)}</TableCell>
                                        <TableCell>{formatIDR(item.total_gaji)}</TableCell>
                                        <TableCell>
                                            {item.generated_from_absensi
                                                ? `H:${item.jumlah_hadir} A:${item.jumlah_alpha} I:${item.jumlah_izin} S:${item.jumlah_sakit} C:${item.jumlah_cuti} T:${item.jumlah_terlambat}`
                                                : "Manual"}
                                        </TableCell>
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
                                                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Data Penggajian</DialogTitle>
                                                            <DialogDescription>Perbarui data penggajian pegawai.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form
                                                            mode="edit"
                                                            endpoint={endpoint}
                                                            initialValues={item}
                                                            pegawaiOptions={pegawaiOptions}
                                                            gajiPokokTemplatePerPegawai={gajiPokokTemplatePerPegawai}
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
                                    <TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">
                                        Belum ada data penggajian.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <PaginationSelect
                        currentPage={penggajian?.meta?.current_page ?? 1}
                        lastPage={penggajian?.meta?.last_page ?? 1}
                        total={penggajian?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
