import { Head, router } from "@inertiajs/react";
import { useState } from "react";

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
import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/Inventory/ResepBOM/Form";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";

export default function Index({ resepBOM, menuOptions, bahanBakuOptions, categoryOptions, filters, flashMessage }) {
    const endpoint = "/inventory/resep-b-o-m";
    const searchValue = filters?.search ?? "";
    const kategoriMenuId = filters?.kategori_menu_id ? String(filters.kategori_menu_id) : "all";

    const [openCreate, setOpenCreate] = useState(false);

    const hasData = (resepBOM?.data ?? []).length > 0;

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();
        const kategori = kategoriMenuId !== "all" ? Number(kategoriMenuId) : undefined;

        router.get(endpoint, { search, kategori_menu_id: kategori }, { preserveState: true, replace: true });
    };

    const submitFilterKategori = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const kategori = (formData.get("kategori_menu_id") || "all").toString();

        router.get(
            endpoint,
            {
                search: searchValue || undefined,
                kategori_menu_id: kategori !== "all" ? Number(kategori) : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const goPage = (page) => {
        router.get(
            endpoint,
            {
                search: searchValue || undefined,
                kategori_menu_id: kategoriMenuId !== "all" ? Number(kategoriMenuId) : undefined,
                page,
            },
            { preserveState: true }
        );
    };

    const openDetail = (menuId) => {
        router.get(
            `${endpoint}/${menuId}`,
            {
                search: searchValue || undefined,
                kategori_menu_id: kategoriMenuId !== "all" ? Number(kategoriMenuId) : undefined,
                page: resepBOM?.meta?.current_page,
            },
            { preserveState: true }
        );
    };

    return (
        <DashboardLayout title="Resep BOM">
            <Head title="Resep BOM" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Inventory</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Resep BOM</h1>
                            <p className="mt-1 text-sm text-slate-600">Definisikan kebutuhan bahan baku untuk setiap menu.</p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Resep BOM</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Resep BOM</DialogTitle>
                                    <DialogDescription>Isi bahan baku dan qty kebutuhan per menu.</DialogDescription>
                                </DialogHeader>
                                <Form
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    menuOptions={menuOptions}
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
                        searchPlaceholder="Cari kode, menu, atau bahan baku"
                        onSubmit={submitSearch}
                        flashMessage={flashMessage?.success}
                    />

                    <form onSubmit={submitFilterKategori} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="w-full sm:max-w-sm">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Filter Kategori</label>
                            <select
                                name="kategori_menu_id"
                                defaultValue={kategoriMenuId}
                                className="h-10 w-full rounded-lg border px-3 text-sm"
                            >
                                <option value="all">Semua kategori</option>
                                {(categoryOptions ?? []).map((category) => (
                                    <option key={category.id} value={String(category.id)}>{category.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="outline">Terapkan</Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.get(endpoint, { search: searchValue || undefined }, { preserveState: true, replace: true })}
                            >
                                Reset
                            </Button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {hasData ? (
                            (resepBOM?.data ?? []).map((menu) => (
                                <article key={menu.data_menu_id} className="rounded-2xl border bg-white p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-wider text-slate-500">{menu.menu_kategori_nama}</p>
                                    <h3 className="mt-1 line-clamp-2 min-h-11 text-base font-semibold text-slate-900">{menu.menu_nama}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{menu.total_bahan} bahan resep</p>
                                    <Button className="mt-3 w-full" variant="outline" onClick={() => openDetail(menu.data_menu_id)}>
                                        Lihat Detail
                                    </Button>
                                </article>
                            ))
                        ) : (
                            <div className="col-span-full rounded-xl border py-12 text-center text-sm text-muted-foreground">Belum ada data resep BOM.</div>
                        )}
                    </div>
                    <PaginationSelect
                        currentPage={resepBOM?.meta?.current_page ?? 1}
                        lastPage={resepBOM?.meta?.last_page ?? 1}
                        total={resepBOM?.meta?.total ?? 0}
                        onPageChange={goPage}
                    />
                </section>
            </div>
        </DashboardLayout>
    );
}
