import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ endpoint, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bahan_baku_id: "",
        kode: "",
        tanggal_transfer: "",
        lokasi_asal: "",
        lokasi_tujuan: "",
        qty_transfer: 0,
        catatan: "",
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
                    <label className="text-sm font-medium">Tanggal Transfer</label>
                    <Input type="date" value={data.tanggal_transfer} onChange={(event) => setData("tanggal_transfer", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Qty Transfer</label>
                    <Input type="number" min={0.001} step="0.001" value={data.qty_transfer} onChange={(event) => setData("qty_transfer", Number(event.target.value || 0))} required />
                    {errors.qty_transfer ? <p className="text-xs text-destructive">{errors.qty_transfer}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lokasi Asal</label>
                    <Input value={data.lokasi_asal} onChange={(event) => setData("lokasi_asal", event.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lokasi Tujuan</label>
                    <Input value={data.lokasi_tujuan} onChange={(event) => setData("lokasi_tujuan", event.target.value)} required />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} />
            </div>

            {errors.general ? <p className="text-xs text-destructive">{errors.general}</p> : null}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
