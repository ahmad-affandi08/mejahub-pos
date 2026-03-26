import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, menuOptions, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        data_menu_id: initialValues?.data_menu_id ?? "",
        bahan_baku_id: initialValues?.bahan_baku_id ?? "",
        kode: initialValues?.kode ?? "",
        qty_kebutuhan: initialValues?.qty_kebutuhan ?? 0,
        satuan: initialValues?.satuan ?? "",
        referensi_porsi: initialValues?.referensi_porsi ?? 1,
        catatan: initialValues?.catatan ?? "",
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
                    <label className="text-sm font-medium">Menu</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.data_menu_id} onChange={(event) => setData("data_menu_id", event.target.value)} required>
                        <option value="">Pilih menu</option>
                        {menuOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.nama}</option>
                        ))}
                    </select>
                    {errors.data_menu_id ? <p className="text-xs text-destructive">{errors.data_menu_id}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bahan Baku</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.bahan_baku_id} onChange={(event) => setData("bahan_baku_id", event.target.value)} required>
                        <option value="">Pilih bahan baku</option>
                        {bahanBakuOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.nama}</option>
                        ))}
                    </select>
                    {errors.bahan_baku_id ? <p className="text-xs text-destructive">{errors.bahan_baku_id}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode (Opsional)</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Auto-generate jika kosong" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Qty Kebutuhan</label>
                    <Input type="number" min={0.001} step="0.001" value={data.qty_kebutuhan} onChange={(event) => setData("qty_kebutuhan", Number(event.target.value || 0))} required />
                    {errors.qty_kebutuhan ? <p className="text-xs text-destructive">{errors.qty_kebutuhan}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Satuan</label>
                    <Input value={data.satuan} onChange={(event) => setData("satuan", event.target.value)} placeholder="gram, ml, pcs" />
                    {errors.satuan ? <p className="text-xs text-destructive">{errors.satuan}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Referensi Porsi</label>
                    <Input type="number" min={0.001} step="0.001" value={data.referensi_porsi} onChange={(event) => setData("referensi_porsi", Number(event.target.value || 1))} />
                    {errors.referensi_porsi ? <p className="text-xs text-destructive">{errors.referensi_porsi}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
