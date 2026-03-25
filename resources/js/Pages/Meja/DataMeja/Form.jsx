import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, areaOptions, statusOptions, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        area_meja_id: initialValues?.area_meja_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        nomor_meja: initialValues?.nomor_meja ?? "",
        kapasitas: initialValues?.kapasitas ?? 1,
        status: initialValues?.status ?? "tersedia",
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
                <label className="text-sm font-medium">Area</label>
                <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.area_meja_id} onChange={(event) => setData("area_meja_id", event.target.value)} required>
                    <option value="">Pilih area</option>
                    {areaOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.nama}</option>
                    ))}
                </select>
                {errors.area_meja_id ? <p className="text-xs text-destructive">{errors.area_meja_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: TBL-01" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Meja</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nomor Meja</label>
                    <Input value={data.nomor_meja} onChange={(event) => setData("nomor_meja", event.target.value)} />
                    {errors.nomor_meja ? <p className="text-xs text-destructive">{errors.nomor_meja}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kapasitas</label>
                    <Input type="number" min={1} value={data.kapasitas} onChange={(event) => setData("kapasitas", Number(event.target.value || 1))} required />
                    {errors.kapasitas ? <p className="text-xs text-destructive">{errors.kapasitas}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Meja</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status} onChange={(event) => setData("status", event.target.value)}>
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Aktif</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1") }>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
