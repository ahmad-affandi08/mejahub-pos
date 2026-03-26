import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Building2, Mail, MapPin, Phone, Globe2, Languages, Wallet } from "lucide-react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
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
import Form from "@/Pages/Settings/ProfilToko/Form";

const resolveLogoUrl = (logoPath) => {
    if (!logoPath) {
        return null;
    }

    if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
        return logoPath;
    }

    if (logoPath.includes("/")) {
        return `/storage/${logoPath}`;
    }

    return `/storage/profil-toko/${logoPath}`;
};

export default function Index({ profilToko, filters, flashMessage }) {
    const endpoint = "/settings/profil-toko";

    const [openCreate, setOpenCreate] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const records = profilToko?.data ?? [];
    const activeProfile = records[0] ?? null;
    const hasData = Boolean(activeProfile);
    const totalData = profilToko?.meta?.total ?? 0;
    const hasMultiple = totalData > 1;

    const extraProfiles = records.slice(1);

    const removeItem = (id) => {
        if (!window.confirm("Hapus profil toko ini?")) return;
        router.post(`${endpoint}/delete`, { id: String(id) }, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Profil Toko">
            <Head title="Profil Toko" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-linear-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Settings</p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Profil Toko</h1>
                            <p className="mt-1 text-sm text-slate-600">Satu halaman ringkas untuk identitas, kontak, dan konfigurasi toko.</p>
                        </div>

                        {!hasData ? (
                            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                                <DialogTrigger asChild>
                                    <Button className="rounded-xl">Buat Profil Toko</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Tambah Profil Toko</DialogTitle>
                                        <DialogDescription>Isi data profil toko secara lengkap.</DialogDescription>
                                    </DialogHeader>
                                    <Form mode="create" endpoint={endpoint} initialValues={null} onSuccess={() => setOpenCreate(false)} onCancel={() => setOpenCreate(false)} />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Dialog open={editingItem?.id === activeProfile.id} onOpenChange={(open) => setEditingItem(open ? activeProfile : null)}>
                                <DialogTrigger asChild>
                                    <Button className="rounded-xl">Edit Profil</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Edit Profil Toko</DialogTitle>
                                        <DialogDescription>Perbarui data profil toko aktif.</DialogDescription>
                                    </DialogHeader>
                                    <Form mode="edit" endpoint={endpoint} initialValues={activeProfile} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </section>

                {!hasData ? (
                    <section className="rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Belum Ada Profil Toko</h2>
                        <p className="mt-1 text-sm text-slate-600">Mulai dengan membuat satu profil toko sebagai identitas utama sistem.</p>
                    </section>
                ) : (
                    <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-6">
                        {flashMessage?.error ? (
                            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{flashMessage.error}</p>
                        ) : null}
                        {flashMessage?.success ? (
                            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flashMessage.success}</p>
                        ) : null}

                        <div className="rounded-2xl border bg-linear-to-r from-slate-900 to-slate-800 p-5 text-white">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                                        {resolveLogoUrl(activeProfile.logo_path) ? (
                                            <img src={resolveLogoUrl(activeProfile.logo_path)} alt={`Logo ${activeProfile.nama_toko}`} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
                                                {String(activeProfile.nama_toko || "T").slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Store Identity</p>
                                        <h2 className="text-2xl font-semibold">{activeProfile.nama_toko}</h2>
                                        <p className="text-sm text-white/80">{activeProfile.nama_brand || "-"}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <POSStatusBadge status={activeProfile.is_default ? "aktif" : "nonaktif"} label={activeProfile.is_default ? "Default" : "No"} />
                                            <POSStatusBadge status={activeProfile.is_active ? "aktif" : "nonaktif"} label={activeProfile.is_active ? "Aktif" : "Nonaktif"} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Dialog open={editingItem?.id === activeProfile.id} onOpenChange={(open) => setEditingItem(open ? activeProfile : null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" className="rounded-xl">Edit Profil</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Edit Profil Toko</DialogTitle>
                                                <DialogDescription>Perbarui data profil toko.</DialogDescription>
                                            </DialogHeader>
                                            <Form mode="edit" endpoint={endpoint} initialValues={activeProfile} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" className="rounded-xl" onClick={() => removeItem(activeProfile.id)}>Hapus</Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-xl border bg-slate-50 p-4">
                                <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500"><Phone className="h-3.5 w-3.5" /> Kontak</p>
                                <p className="text-sm font-medium text-slate-900">{activeProfile.telepon || "-"}</p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail className="h-4 w-4" /> {activeProfile.email || "-"}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-4">
                                <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500"><MapPin className="h-3.5 w-3.5" /> Alamat</p>
                                <p className="text-sm font-medium text-slate-900">{activeProfile.alamat || "-"}</p>
                                <p className="mt-1 text-sm text-slate-600">{[activeProfile.kota, activeProfile.provinsi, activeProfile.kode_pos].filter(Boolean).join(", ") || "-"}</p>
                            </div>
                            <div className="rounded-xl border bg-slate-50 p-4">
                                <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500"><Globe2 className="h-3.5 w-3.5" /> Konfigurasi</p>
                                <p className="flex items-center gap-2 text-sm text-slate-700"><Wallet className="h-4 w-4" /> {activeProfile.mata_uang || "IDR"}</p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><Languages className="h-4 w-4" /> {activeProfile.bahasa || "id"} | {activeProfile.timezone || "Asia/Jakarta"}</p>
                            </div>
                        </div>

                        {hasMultiple ? (
                            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-sm text-rose-700">Ditemukan {totalData} profil toko. Sistem menggunakan data pertama sebagai profil aktif. Mohon hapus data duplikat agar tetap konsisten.</p>
                                <div className="mt-3 space-y-2">
                                    {extraProfiles.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                                            <p className="text-sm text-slate-700">{item.nama_toko} ({item.kode_toko || "-"})</p>
                                            <div className="flex items-center gap-2">
                                                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Profil Toko</DialogTitle>
                                                            <DialogDescription>Perbarui data profil toko.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form mode="edit" endpoint={endpoint} initialValues={item} onSuccess={() => setEditingItem(null)} onCancel={() => setEditingItem(null)} />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>Hapus</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}
