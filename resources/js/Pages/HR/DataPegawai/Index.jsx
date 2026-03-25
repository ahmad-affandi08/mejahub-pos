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

function PegawaiForm({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        no_identitas: initialValues?.no_identitas ?? "",
        nama: initialValues?.nama ?? "",
        jabatan: initialValues?.jabatan ?? "",
        nomor_telepon: initialValues?.nomor_telepon ?? "",
        alamat: initialValues?.alamat ?? "",
        email: initialValues?.email ?? "",
        password: "",
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset("password");
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">no_identitas</label>
                    <Input
                        value={data.no_identitas}
                        onChange={(event) => setData("no_identitas", event.target.value)}
                        placeholder="Contoh: EMP-0001"
                    />
                    {errors.no_identitas ? <p className="text-xs text-destructive">{errors.no_identitas}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Pegawai</label>
                    <Input
                        value={data.nama}
                        onChange={(event) => setData("nama", event.target.value)}
                        placeholder="Nama lengkap"
                        required
                    />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jabatan</label>
                    <Input
                        value={data.jabatan}
                        onChange={(event) => setData("jabatan", event.target.value)}
                        placeholder="Kasir / Supervisor"
                    />
                    {errors.jabatan ? <p className="text-xs text-destructive">{errors.jabatan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nomor Telepon</label>
                    <Input
                        value={data.nomor_telepon}
                        onChange={(event) => setData("nomor_telepon", event.target.value)}
                        placeholder="08xxxxxxxxxx"
                    />
                    {errors.nomor_telepon ? <p className="text-xs text-destructive">{errors.nomor_telepon}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Alamat</label>
                <Input
                    value={data.alamat}
                    onChange={(event) => setData("alamat", event.target.value)}
                    placeholder="Alamat pegawai"
                />
                {errors.alamat ? <p className="text-xs text-destructive">{errors.alamat}</p> : null}
            </div>

            <div className="rounded-xl border border-dashed p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Data Auth</p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email Login</label>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData("email", event.target.value)}
                            placeholder="pegawai@mejahub.local"
                        />
                        {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Password Login</label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(event) => setData("password", event.target.value)}
                            placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                        />
                        {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
                    </div>
                </div>
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

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function Index({ pegawai, filters, flashMessage }) {
    const endpoint = "/hr/data-pegawai";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (pegawai?.data ?? []).length > 0;

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
        router.delete(`${endpoint}/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Data Pegawai" />

            <div className="min-h-screen bg-linear-to-b from-cyan-50 via-slate-50 to-emerald-50 p-4 md:p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-100 blur-2xl" />
                        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-100 blur-2xl" />

                        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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

                                    <PegawaiForm
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

                            {flashMessage?.success ? (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {flashMessage.success}
                                </p>
                            ) : null}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>no_identitas</TableHead>
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

                                                            <PegawaiForm
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
                                        <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                            Belum ada data pegawai.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Halaman {pegawai.meta.current_page} dari {pegawai.meta.last_page} | Total {pegawai.meta.total} data
                            </span>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pegawai.meta.current_page <= 1}
                                    onClick={() => goPage(pegawai.meta.current_page - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pegawai.meta.current_page >= pegawai.meta.last_page}
                                    onClick={() => goPage(pegawai.meta.current_page + 1)}
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
