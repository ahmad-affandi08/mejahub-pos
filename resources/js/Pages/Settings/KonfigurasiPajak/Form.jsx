import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        jenis: initialValues?.jenis ?? "percentage",
        nilai: initialValues?.nilai ?? 0,
        applies_to: initialValues?.applies_to ?? "all",
        is_inclusive: initialValues?.is_inclusive ?? false,
        is_default: initialValues?.is_default ?? false,
        is_active: initialValues?.is_active ?? true,
        urutan: initialValues?.urutan ?? 0,
        keterangan: initialValues?.keterangan ?? "",
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
                    <label className="text-sm font-medium">Nama Pajak</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jenis</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis} onChange={(event) => setData("jenis", event.target.value)}>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nilai</label>
                    <Input type="number" step="0.01" min="0" value={data.nilai} onChange={(event) => setData("nilai", event.target.value)} required />
                    {errors.nilai ? <p className="text-xs text-destructive">{errors.nilai}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Applies To</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.applies_to} onChange={(event) => setData("applies_to", event.target.value)}>
                        <option value="subtotal">Subtotal</option>
                        <option value="service_charge">Service Charge</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Inclusive</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_inclusive ? "1" : "0"} onChange={(event) => setData("is_inclusive", event.target.value === "1")}>
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_default ? "1" : "0"} onChange={(event) => setData("is_default", event.target.value === "1")}>
                        <option value="0">No</option>
                        <option value="1">Yes</option>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Urutan</label>
                    <Input type="number" min="0" value={data.urutan} onChange={(event) => setData("urutan", event.target.value)} />
                    {errors.urutan ? <p className="text-xs text-destructive">{errors.urutan}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Keterangan</label>
                    <Textarea value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} rows={2} />
                    {errors.keterangan ? <p className="text-xs text-destructive">{errors.keterangan}</p> : null}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
