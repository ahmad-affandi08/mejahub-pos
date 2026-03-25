import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const initialOpsi = (initialValues?.opsi ?? []).join(", ");

    const { data, setData, post, put, processing, errors, reset, transform } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        tipe: initialValues?.tipe ?? "multiple",
        min_pilih: initialValues?.min_pilih ?? 0,
        max_pilih: initialValues?.max_pilih ?? 1,
        urutan: initialValues?.urutan ?? 0,
        is_active: initialValues?.is_active ?? true,
        opsi_text: initialOpsi,
    });

    const submit = (event) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            opsi: current.opsi_text
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0),
        }));

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
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Modifier</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tipe</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.tipe} onChange={(event) => setData("tipe", event.target.value)}>
                        <option value="single">Single</option>
                        <option value="multiple">Multiple</option>
                    </select>
                    {errors.tipe ? <p className="text-xs text-destructive">{errors.tipe}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Min Pilih</label>
                    <Input type="number" min={0} value={data.min_pilih} onChange={(event) => setData("min_pilih", Number(event.target.value || 0))} />
                    {errors.min_pilih ? <p className="text-xs text-destructive">{errors.min_pilih}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Max Pilih</label>
                    <Input type="number" min={1} value={data.max_pilih} onChange={(event) => setData("max_pilih", Number(event.target.value || 1))} />
                    {errors.max_pilih ? <p className="text-xs text-destructive">{errors.max_pilih}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Urutan</label>
                    <Input type="number" min={0} value={data.urutan} onChange={(event) => setData("urutan", Number(event.target.value || 0))} />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Opsi (pisahkan dengan koma)</label>
                <Input value={data.opsi_text} onChange={(event) => setData("opsi_text", event.target.value)} placeholder="Pedas, Extra Keju, No Onion" />
                {errors.opsi ? <p className="text-xs text-destructive">{errors.opsi}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1") }>
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </select>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
