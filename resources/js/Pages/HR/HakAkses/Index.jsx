import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import Form from "@/Pages/HR/HakAkses/Form";
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

export default function Index({ hakAkses, userOptions, filters, flashMessage }) {
    const endpoint = "/hr/hak-akses";
    const searchValue = filters?.search ?? "";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const hasData = (hakAkses?.data ?? []).length > 0;

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
        if (!window.confirm("Hapus role ini?")) return;
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
        <DashboardLayout title="Hak Akses">
            <Head title="Hak Akses" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HR Security</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Hak Akses</h1>
                            <p className="mt-1 text-sm text-slate-600">
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
                                <Form
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

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <form onSubmit={submitSearch} className="flex w-full max-w-md gap-2">
                            <Input name="search" defaultValue={searchValue} placeholder="Cari nama/kode role" />
                            <Button variant="outline" type="submit">Cari</Button>
                        </form>

                        {flashMessage?.success ? (
                            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flashMessage.success}</p>
                        ) : null}
                    </div>

                    <div className="w-full overflow-x-auto">
                        <Table className="w-full table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead className="w-[34%]">Permission</TableHead>
                                <TableHead className="w-[16%]">User Assigned</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                hakAkses.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.kode}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell className="wrap-break-word whitespace-normal">{item.permissions.join(", ") || "-"}</TableCell>
                                        <TableCell className="wrap-break-word whitespace-normal">{item.users.map((u) => u.name).join(", ") || "-"}</TableCell>
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
                                                            <DialogTitle>Edit Role Hak Akses</DialogTitle>
                                                            <DialogDescription>
                                                                Perbarui role, permission key, dan assignment user.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <Form
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
                    </div>

                    {hakAkses?.meta ? (
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Halaman {hakAkses.meta.current_page} dari {hakAkses.meta.last_page} | Total {hakAkses.meta.total} data
                            </span>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={hakAkses.meta.current_page <= 1}
                                    onClick={() => goPage(hakAkses.meta.current_page - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={hakAkses.meta.current_page >= hakAkses.meta.last_page}
                                    onClick={() => goPage(hakAkses.meta.current_page + 1)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </DashboardLayout>
    );
}
