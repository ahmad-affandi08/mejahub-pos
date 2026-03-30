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
import Form from "@/Pages/Inventory/PurchaseOrder/Form";

export default function Index({ purchaseOrders, supplierOptions, bahanBakuOptions, filters, flashMessage }) {
    const endpoint = "/inventory/purchase-order";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (purchaseOrders?.data ?? []).length > 0;
    const currentRows = (purchaseOrders?.data ?? []);
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
        if (!window.confirm("Hapus purchase order ini?")) return;

        const normalizedId = String(id ?? "").trim();
        if (!normalizedId) {
            window.alert("ID data tidak valid. Muat ulang halaman lalu coba lagi.");
            return;
        }

        router.post(`${endpoint}/delete`, { id: normalizedId }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Purchase Order">
            <Head title="Purchase Order" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Purchase Order</h1>
                            <p className="mt-1 text-sm text-slate-600">Kelola pesanan pembelian ke supplier.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah PO</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Purchase Order</DialogTitle>
                                    <DialogDescription>Buat PO baru beserta item pembelian.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
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
                        searchPlaceholder="Cari kode PO atau supplier"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Jumlah Item</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    purchaseOrders.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                            <TableCell className="font-medium">{item.kode}</TableCell>
                                            <TableCell>{item.supplier_nama || "-"}</TableCell>
                                            <TableCell>{item.tanggal_po || "-"}</TableCell>
                                            <TableCell><POSStatusBadge status={item.status} /></TableCell>
                                            <TableCell>{formatIDR(item.total)}</TableCell>
                                            <TableCell>{item.items?.length || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">Edit</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Purchase Order</DialogTitle>
                                                                <DialogDescription>Perbarui data PO dan item.</DialogDescription>
                                                            </DialogHeader>
                                                            <Form
                                                                mode="edit"
                                                                endpoint={endpoint}
                                                                initialValues={item}
                                                                supplierOptions={supplierOptions}
                                                                bahanBakuOptions={bahanBakuOptions}
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
                                        <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Belum ada purchase order.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationSelect
                        currentPage={purchaseOrders?.meta?.current_page ?? 1}
                        lastPage={purchaseOrders?.meta?.last_page ?? 1}
                        total={purchaseOrders?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
