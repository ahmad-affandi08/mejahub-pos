import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ endpoint, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bahan_baku_id: "",
        kode: "",
        tanggal_opname: "",
        stok_fisik: 0,
        alasan: "",
        status: "posted",
    });

    const submit = (event) => {
        event.preventDefault();
        post(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Bahan Baku</label>
                <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.bahan_baku_id} onChange={(event) => setData("bahan_baku_id", event.target.value)} required>
                    <option value="">Pilih bahan</option>
                    {bahanBakuOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.nama} (Stok: {opt.stok_saat_ini})</option>
                    ))}
                </select>
                {errors.bahan_baku_id ? <p className="text-xs text-destructive">{errors.bahan_baku_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode (Opsional)</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Auto-generate jika kosong" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Opname</label>
                    <Input type="date" value={data.tanggal_opname} onChange={(event) => setData("tanggal_opname", event.target.value)} />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Stok Fisik</label>
                <Input type="number" min={0} step="0.001" value={data.stok_fisik} onChange={(event) => setData("stok_fisik", Number(event.target.value || 0))} required />
                {errors.stok_fisik ? <p className="text-xs text-destructive">{errors.stok_fisik}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Alasan</label>
                <Input value={data.alasan} onChange={(event) => setData("alasan", event.target.value)} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
