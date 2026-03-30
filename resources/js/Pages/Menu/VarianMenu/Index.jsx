import { Head, router } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Menu/VarianMenu/Form";
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

export default function Index({ varianMenu, menuOptions, filters, flashMessage }) {
    const endpoint = "/menu/varian-menu";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (varianMenu?.data ?? []).length > 0;
    const currentRows = (varianMenu?.data ?? []);
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
        if (!window.confirm("Hapus varian menu ini?")) return;
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
        <DashboardLayout title="Varian Menu">
            <Head title="Varian Menu" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Master Data</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Varian Menu</h1>
                            <p className="mt-1 text-sm text-slate-600">Atur varian item menu seperti size atau level tambahan.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Varian</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Varian Menu</DialogTitle>
                                    <DialogDescription>Hubungkan varian dengan menu induk dan atur harga tambahannya.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    menuOptions={menuOptions}
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
                        searchPlaceholder="Cari nama atau kode varian"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    
                        rightContent={<BulkDeleteDialog bulkDelete={bulkDelete} />}
                    />

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <BulkDeleteHeaderCheckbox bulkDelete={bulkDelete} />
                                    <TableHead>Menu</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Varian</TableHead>
                                    <TableHead>Harga Tambahan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    varianMenu.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <BulkDeleteRowCheckbox bulkDelete={bulkDelete} rowId={item.id} />
                                            <TableCell>{item.data_menu_nama || "-"}</TableCell>
                                            <TableCell>{item.kode || "-"}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell>{formatIDR(item.harga_tambahan)}</TableCell>
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
                                                                <DialogTitle>Edit Varian Menu</DialogTitle>
                                                                <DialogDescription>Perbarui data varian menu.</DialogDescription>
                                                            </DialogHeader>
                                                            <Form
                                                                mode="edit"
                                                                endpoint={endpoint}
                                                                initialValues={item}
                                                                menuOptions={menuOptions}
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
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Belum ada varian menu.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationSelect
                        currentPage={varianMenu?.meta?.current_page ?? 1}
                        lastPage={varianMenu?.meta?.last_page ?? 1}
                        total={varianMenu?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
