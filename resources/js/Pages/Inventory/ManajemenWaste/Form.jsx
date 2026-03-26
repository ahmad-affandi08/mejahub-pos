import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ endpoint, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bahan_baku_id: "",
        kode: "",
        tanggal_waste: "",
        qty_waste: 0,
        kategori_waste: "",
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
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Waste</label>
                    <Input type="date" value={data.tanggal_waste} onChange={(event) => setData("tanggal_waste", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Qty Waste</label>
                    <Input type="number" min={0.001} step="0.001" value={data.qty_waste} onChange={(event) => setData("qty_waste", Number(event.target.value || 0))} required />
                    {errors.qty_waste ? <p className="text-xs text-destructive">{errors.qty_waste}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kategori Waste</label>
                    <Input value={data.kategori_waste} onChange={(event) => setData("kategori_waste", event.target.value)} placeholder="Expired, rusak, dll" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Alasan</label>
                    <Input value={data.alasan} onChange={(event) => setData("alasan", event.target.value)} />
                </div>
            </div>

            {errors.general ? <p className="text-xs text-destructive">{errors.general}</p> : null}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
