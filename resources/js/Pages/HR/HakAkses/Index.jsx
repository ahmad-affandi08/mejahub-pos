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

function RoleForm({ mode, endpoint, initialValues, userOptions, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        permissions_text: (initialValues?.permissions ?? []).join(", "),
        user_ids: initialValues?.user_ids ?? [],
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const payload = {
            kode: data.kode,
            nama: data.nama,
            deskripsi: data.deskripsi,
            is_active: data.is_active,
            user_ids: data.user_ids,
            permissions: data.permissions_text
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        };

        const options = {
            preserveScroll: true,
            onSuccess,
        };

        if (mode === "edit" && initialValues?.id) {
            put(`${endpoint}/${initialValues.id}`, { ...options, data: payload });
            return;
        }

        post(endpoint, { ...options, data: payload });
    };

    const selectedUsersText = useMemo(() => {
        if (!data.user_ids.length) return "Belum ada user terpilih";

        return userOptions
            .filter((user) => data.user_ids.includes(user.id))
            .map((user) => user.name)
            .join(", ");
    }, [data.user_ids, userOptions]);

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode Role</label>
                    <Input
                        value={data.kode}
                        onChange={(event) => setData("kode", event.target.value)}
                        placeholder="Contoh: kasir"
                        required
                    />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Role</label>
                    <Input
                        value={data.nama}
                        onChange={(event) => setData("nama", event.target.value)}
                        placeholder="Contoh: Kasir Outlet"
                        required
                    />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input
                    value={data.deskripsi}
                    onChange={(event) => setData("deskripsi", event.target.value)}
                    placeholder="Deskripsi singkat role"
                />
                {errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Permission Keys (pisahkan koma)</label>
                <Input
                    value={data.permissions_text}
                    onChange={(event) => setData("permissions_text", event.target.value)}
                    placeholder="menu.kategori-menu.access, hr.data-pegawai.access"
                />
                {errors.permissions ? <p className="text-xs text-destructive">{errors.permissions}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Assign User</label>
                <select
                    multiple
                    className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                    value={data.user_ids.map(String)}
                    onChange={(event) => {
                        const values = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
                        setData("user_ids", values);
                    }}
                >
                    {userOptions.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">{selectedUsersText}</p>
                {errors.user_ids ? <p className="text-xs text-destructive">{errors.user_ids}</p> : null}
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
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}

export default function Index({ hakAkses, userOptions, filters, flashMessage }) {
    const endpoint = "/hr/hak-akses";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (hakAkses?.data ?? []).length > 0;

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const search = (formData.get("search") || "").toString();

        router.get(endpoint, { search }, { preserveState: true, replace: true });
    };

    const removeItem = (id) => {
        if (!window.confirm("Hapus role ini?")) return;
        router.delete(`${endpoint}/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Hak Akses" />

            <div className="space-y-6">
                <section className="rounded-2xl border bg-card p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">HR Security</p>
                            <h1 className="text-2xl font-semibold">Hak Akses</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Kelola role, permission key, dan assignment user.
                            </p>
                        </div>

                        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                            <DialogTrigger asChild>
                                <Button>Tambah Role</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah Role Hak Akses</DialogTitle>
                                    <DialogDescription>
                                        Isi role lalu tentukan permission key dan user yang memiliki role tersebut.
                                    </DialogDescription>
                                </DialogHeader>
                                <RoleForm
                                    mode="create"
                                    endpoint={endpoint}
                                    initialValues={null}
                                    userOptions={userOptions}
                                    onSuccess={() => setOpenCreate(false)}
                                    onCancel={() => setOpenCreate(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section className="rounded-2xl border bg-card p-4 md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
                            <Input name="search" defaultValue={searchValue} placeholder="Cari nama/kode role" />
                            <Button variant="outline" type="submit">Cari</Button>
                        </form>

                        {flashMessage?.success ? (
                            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flashMessage.success}</p>
                        ) : null}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Permission</TableHead>
                                <TableHead>User Assigned</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                hakAkses.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode}</TableCell>
                                        <TableCell>{item.nama}</TableCell>
                                        <TableCell>{item.permissions.join(", ") || "-"}</TableCell>
                                        <TableCell>{item.users.map((u) => u.name).join(", ") || "-"}</TableCell>
                                        <TableCell>{item.is_active ? "Aktif" : "Nonaktif"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Dialog
                                                    open={editingItem?.id === item.id}
                                                    onOpenChange={(open) => setEditingItem(open ? item : null)}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Role Hak Akses</DialogTitle>
                                                            <DialogDescription>
                                                                Perbarui role, permission key, dan assignment user.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <RoleForm
                                                            mode="edit"
                                                            endpoint={endpoint}
                                                            initialValues={item}
                                                            userOptions={userOptions}
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
                                        Belum ada role hak akses.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </section>
            </div>
        </>
    );
}
