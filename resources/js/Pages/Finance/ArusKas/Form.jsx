import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        entry_type: "manual",
        tanggal: initialValues?.tanggal ?? "",
        jenis_akun: initialValues?.jenis_akun ?? "kas",
        jenis_arus: initialValues?.jenis_arus ?? "in",
        referensi_kode: initialValues?.referensi_kode ?? "",
        kategori: initialValues?.kategori ?? "lainnya",
        deskripsi: initialValues?.deskripsi ?? "",
        nominal: initialValues?.nominal ?? 0,
        status: initialValues?.status ?? "posted",
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onSuccess?.(),
        };

        if (mode === "edit" && initialValues?.id) {
            transform((payload) => ({ ...payload, _method: "put" }));
            post(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        transform((payload) => payload);
        post(endpoint, options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input type="date" value={data.tanggal} onChange={(event) => setData("tanggal", event.target.value)} required />
                    {errors.tanggal ? <p className="text-xs text-destructive">{errors.tanggal}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jenis Akun</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis_akun} onChange={(event) => setData("jenis_akun", event.target.value)}>
                        <option value="kas">Kas</option>
                        <option value="bank">Bank</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jenis Arus</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis_arus} onChange={(event) => setData("jenis_arus", event.target.value)}>
                        <option value="in">Masuk</option>
                        <option value="out">Keluar</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nominal</label>
                    <Input type="number" min={0} step="0.01" value={data.nominal} onChange={(event) => setData("nominal", Number(event.target.value || 0))} required />
                    {errors.nominal ? <p className="text-xs text-destructive">{errors.nominal}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Referensi Kode</label>
                    <Input value={data.referensi_kode} onChange={(event) => setData("referensi_kode", event.target.value)} placeholder="Opsional" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kategori</label>
                    <Input value={data.kategori} onChange={(event) => setData("kategori", event.target.value)} />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} required />
                {errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
