import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        tipe: initialValues?.tipe ?? "cash",
        provider: initialValues?.provider ?? "",
        nomor_rekening: initialValues?.nomor_rekening ?? "",
        atas_nama: initialValues?.atas_nama ?? "",
        biaya_persen: initialValues?.biaya_persen ?? 0,
        biaya_flat: initialValues?.biaya_flat ?? 0,
        urutan: initialValues?.urutan ?? 0,
        requires_reference: initialValues?.requires_reference ?? false,
        is_default: initialValues?.is_default ?? false,
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} required />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tipe</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.tipe} onChange={(event) => setData("tipe", event.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="digital">Digital</option>
                        <option value="card">Card</option>
                        <option value="transfer">Transfer</option>
                        <option value="ewallet">E-Wallet</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Provider</label>
                    <Input value={data.provider} onChange={(event) => setData("provider", event.target.value)} />
                    {errors.provider ? <p className="text-xs text-destructive">{errors.provider}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nomor Rekening/Ref</label>
                    <Input value={data.nomor_rekening} onChange={(event) => setData("nomor_rekening", event.target.value)} />
                    {errors.nomor_rekening ? <p className="text-xs text-destructive">{errors.nomor_rekening}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Atas Nama</label>
                    <Input value={data.atas_nama} onChange={(event) => setData("atas_nama", event.target.value)} />
                    {errors.atas_nama ? <p className="text-xs text-destructive">{errors.atas_nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya %</label>
                    <Input type="number" step="0.01" min="0" value={data.biaya_persen} onChange={(event) => setData("biaya_persen", event.target.value)} />
                    {errors.biaya_persen ? <p className="text-xs text-destructive">{errors.biaya_persen}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Biaya Flat</label>
                    <Input type="number" step="0.01" min="0" value={data.biaya_flat} onChange={(event) => setData("biaya_flat", event.target.value)} />
                    {errors.biaya_flat ? <p className="text-xs text-destructive">{errors.biaya_flat}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Urutan</label>
                    <Input type="number" min="0" value={data.urutan} onChange={(event) => setData("urutan", event.target.value)} />
                    {errors.urutan ? <p className="text-xs text-destructive">{errors.urutan}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Perlu Reference</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.requires_reference ? "1" : "0"} onChange={(event) => setData("requires_reference", event.target.value === "1")}>
                        <option value="0">Tidak</option>
                        <option value="1">Ya</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_default ? "1" : "0"} onChange={(event) => setData("is_default", event.target.value === "1")}>
                        <option value="0">Tidak</option>
                        <option value="1">Ya</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
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
