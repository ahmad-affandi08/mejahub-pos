import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

function KategoriForm({
    mode,
    initialValues,
    onSuccess,
    onCancel,
    endpoint,
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        urutan: initialValues?.urutan ?? 0,
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        };

        if (mode === "edit" && initialValues?.id) {
            put(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        post(endpoint, options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Kode</label>
                <Input
                    value={data.kode}
                    onChange={(event) => setData("kode", event.target.value)}
                    placeholder="Contoh: MKN"
                />
                {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Kategori</label>
                <Input
                    value={data.nama}
                    onChange={(event) => setData("nama", event.target.value)}
                    placeholder="Contoh: Makanan"
                    required
                />
                {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input
                    value={data.deskripsi}
                    onChange={(event) => setData("deskripsi", event.target.value)}
                    placeholder="Catatan singkat kategori"
                />
                {errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Urutan</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.urutan}
                        onChange={(event) => setData("urutan", Number(event.target.value || 0))}
                    />
                    {errors.urutan ? <p className="text-xs text-destructive">{errors.urutan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                        value={data.is_active ? "1" : "0"}
                        onChange={(event) => setData("is_active", event.target.value === "1")}
                    >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                    {errors.is_active ? <p className="text-xs text-destructive">{errors.is_active}</p> : null}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function Index({ kategoriMenu, filters, flashMessage }) {
    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const endpoint = "/menu/kategori-menu";
    const searchValue = filters?.search ?? "";

    const hasData = (kategoriMenu?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus kategori ini?")) return;

        router.delete(`${endpoint}/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Kategori Menu" />

            <div className="min-h-screen bg-linear-to-b from-slate-50 via-orange-50 to-amber-50 p-4 md:p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-100 blur-2xl" />
                        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-amber-100 blur-2xl" />

                        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                                    Master Data
                                </p>
                                <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Kategori Menu</h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Kelola kategori untuk pengelompokan menu di POS.
                                </p>
                            </div>

                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button>Tambah Kategori</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Tambah Kategori Menu</DialogTitle>
                                        <DialogDescription>
                                            Isi data kategori, lalu simpan untuk menambahkan ke master menu.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <KategoriForm
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
                                <Input name="search" defaultValue={searchValue} placeholder="Cari nama atau kode kategori" />
                                <Button variant="outline" type="submit">Cari</Button>
                            </form>

                            {flashMessage?.success ? (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {flashMessage.success}
                                </p>
                            ) : null}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Urutan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    kategoriMenu.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.kode || "-"}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell>{item.deskripsi || "-"}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        item.is_active ? badgeClass.aktif : badgeClass.nonaktif
                                                    }`}
                                                >
                                                    {item.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.urutan}</TableCell>
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
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Kategori Menu</DialogTitle>
                                                                <DialogDescription>
                                                                    Ubah data kategori menu lalu simpan perubahan.
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <KategoriForm
                                                                mode="edit"
                                                                endpoint={endpoint}
                                                                initialValues={item}
                                                                onSuccess={() => setEditingItem(null)}
                                                                onCancel={() => setEditingItem(null)}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                            Belum ada kategori menu.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Halaman {kategoriMenu.meta.current_page} dari {kategoriMenu.meta.last_page} | Total {kategoriMenu.meta.total} data
                            </span>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={kategoriMenu.meta.current_page <= 1}
                                    onClick={() => goPage(kategoriMenu.meta.current_page - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={kategoriMenu.meta.current_page >= kategoriMenu.meta.last_page}
                                    onClick={() => goPage(kategoriMenu.meta.current_page + 1)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
