import { Head, router } from "@inertiajs/react";
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
import Form from "@/Pages/Inventory/PenerimaanBarang/Form";

export default function Index({ penerimaanBarang, purchaseOrderOptions, supplierOptions, bahanBakuOptions, filters, flashMessage }) {
    const endpoint = "/inventory/penerimaan-barang";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);

    const hasData = (penerimaanBarang?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus data penerimaan ini? Stok akan dikoreksi.")) return;

        const normalizedId = String(id ?? "").trim();
        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, { id: normalizedId }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Penerimaan Barang">
            <Head title="Penerimaan Barang" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Penerimaan Barang</h1>
                            <p className="mt-1 text-sm text-slate-600">Catat barang datang dan update stok otomatis.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Penerimaan</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Penerimaan Barang</DialogTitle>
                                    <DialogDescription>Input barang diterima untuk update stok.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    endpoint={endpoint}
                                    purchaseOrderOptions={purchaseOrderOptions}
                                    supplierOptions={supplierOptions}
                                    bahanBakuOptions={bahanBakuOptions}
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
                        searchPlaceholder="Cari kode penerimaan, PO, supplier"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>PO</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal Terima</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Jumlah Item</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    penerimaanBarang.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.kode}</TableCell>
                                            <TableCell>{item.purchase_order_kode || "-"}</TableCell>
                                            <TableCell>{item.supplier_nama || "-"}</TableCell>
                                            <TableCell>{item.tanggal_terima || "-"}</TableCell>
                                            <TableCell><POSStatusBadge status={item.status} /></TableCell>
                                            <TableCell>{formatIDR(item.total)}</TableCell>
                                            <TableCell>{item.items?.length || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Belum ada data penerimaan barang.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {penerimaanBarang.meta.current_page} dari {penerimaanBarang.meta.last_page} | Total {penerimaanBarang.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={penerimaanBarang.meta.current_page <= 1} onClick={() => goPage(penerimaanBarang.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={penerimaanBarang.meta.current_page >= penerimaanBarang.meta.last_page} onClick={() => goPage(penerimaanBarang.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
