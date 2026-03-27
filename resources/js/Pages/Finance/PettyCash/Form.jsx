import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing } = useForm({
        tanggal: initialValues?.tanggal ?? "",
        jenis_transaksi: initialValues?.jenis_transaksi ?? "pengisian",
        jenis_arus: initialValues?.jenis_arus ?? "in",
        nominal: initialValues?.nominal ?? 0,
        deskripsi: initialValues?.deskripsi ?? "",
        bahan_baku_id: initialValues?.bahan_baku_id ?? null,
        qty_bahan: initialValues?.qty_bahan ?? null,
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
        action: "",
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
                <div className="space-y-1.5"><label className="text-sm font-medium">Tanggal</label><Input type="date" value={data.tanggal} onChange={(event) => setData("tanggal", event.target.value)} required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Nominal</label><Input type="number" min={0} step="0.01" value={data.nominal} onChange={(event) => setData("nominal", Number(event.target.value || 0))} required /></div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jenis Transaksi</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis_transaksi} onChange={(event) => setData("jenis_transaksi", event.target.value)}>
                        <option value="pengisian">Pengisian</option>
                        <option value="operasional">Operasional</option>
                        <option value="penyesuaian">Penyesuaian</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jenis Arus</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis_arus} onChange={(event) => {
                        setData((prev) => ({
                            ...prev,
                            jenis_arus: event.target.value,
                            bahan_baku_id: event.target.value === "out" ? prev.bahan_baku_id : null,
                            qty_bahan: event.target.value === "out" ? prev.qty_bahan : null,
                        }));
                    }}>
                        <option value="in">Masuk</option>
                        <option value="out">Keluar</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5"><label className="text-sm font-medium">Deskripsi / Keperluan</label><Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} required /></div>

            {data.jenis_arus === "out" && (
                <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            id="beli_bahan"
                            checked={!!data.bahan_baku_id}
                            onChange={(e) => {
                                setData((prev) => ({
                                    ...prev,
                                    bahan_baku_id: e.target.checked ? "" : null,
                                    qty_bahan: e.target.checked ? "" : null,
                                }));
                            }}
                        />
                        <label htmlFor="beli_bahan" className="text-sm font-medium text-slate-700">Pembelian Bahan Baku (Auto tambah stok)</label>
                    </div>

                    {data.bahan_baku_id !== null && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Bahan Baku</label>
                                <select 
                                    className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm" 
                                    value={data.bahan_baku_id} 
                                    onChange={(e) => setData("bahan_baku_id", e.target.value || "")}
                                    required
                                >
                                    <option value="" disabled>Pilih bahan baku...</option>
                                    {(window.bahanBakuList || []).map((bahan) => (
                                        <option key={bahan.id} value={bahan.id}>{bahan.nama} ({bahan.satuan})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Qty Dibeli</label>
                                <Input 
                                    type="number" 
                                    min={0.001} 
                                    step="0.001" 
                                    className="bg-white"
                                    value={data.qty_bahan || ""} 
                                    onChange={(event) => setData("qty_bahan", event.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === "edit" ? (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Aksi Approval (Opsional)</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.action} onChange={(event) => setData("action", event.target.value)}>
                        <option value="">Tanpa aksi</option>
                        <option value="submit">Submit</option>
                        <option value="approve">Approve</option>
                        <option value="reject">Reject</option>
                    </select>
                </div>
            ) : null}

            <div className="space-y-1.5"><label className="text-sm font-medium">Catatan</label><Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} /></div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
