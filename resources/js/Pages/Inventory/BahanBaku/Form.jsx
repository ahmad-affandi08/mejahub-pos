import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, supplierOptions, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        supplier_id: initialValues?.supplier_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        satuan: initialValues?.satuan ?? "",
        harga_beli_terakhir: initialValues?.harga_beli_terakhir ?? 0,
        stok_minimum: initialValues?.stok_minimum ?? 0,
        stok_saat_ini: initialValues?.stok_saat_ini ?? 0,
        keterangan: initialValues?.keterangan ?? "",
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
                <label className="text-sm font-medium">Supplier</label>
                <select
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                    value={data.supplier_id}
                    onChange={(event) => setData("supplier_id", event.target.value)}
                >
                    <option value="">Tanpa supplier</option>
                    {supplierOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.nama}</option>
                    ))}
                </select>
                {errors.supplier_id ? <p className="text-xs text-destructive">{errors.supplier_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: BB-001" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Bahan</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Satuan</label>
                    <Input value={data.satuan} onChange={(event) => setData("satuan", event.target.value)} placeholder="kg, gram, liter, pcs" required />
                    {errors.satuan ? <p className="text-xs text-destructive">{errors.satuan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Harga Beli Terakhir</label>
                    <Input type="number" min={0} step="0.01" value={data.harga_beli_terakhir} onChange={(event) => setData("harga_beli_terakhir", Number(event.target.value || 0))} />
                    {errors.harga_beli_terakhir ? <p className="text-xs text-destructive">{errors.harga_beli_terakhir}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Stok Minimum</label>
                    <Input type="number" min={0} step="0.001" value={data.stok_minimum} onChange={(event) => setData("stok_minimum", Number(event.target.value || 0))} />
                    {errors.stok_minimum ? <p className="text-xs text-destructive">{errors.stok_minimum}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Stok Saat Ini</label>
                    <Input type="number" min={0} step="0.001" value={data.stok_saat_ini} onChange={(event) => setData("stok_saat_ini", Number(event.target.value || 0))} />
                    {errors.stok_saat_ini ? <p className="text-xs text-destructive">{errors.stok_saat_ini}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Keterangan</label>
                    <Input value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} />
                    {errors.keterangan ? <p className="text-xs text-destructive">{errors.keterangan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
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
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
