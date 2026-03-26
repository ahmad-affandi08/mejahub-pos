import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, categoryOptions = [], onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        tanggal: initialValues?.tanggal ?? "",
        kategori_biaya: initialValues?.kategori_biaya ?? (categoryOptions[0] || "lainnya"),
        metode_pembayaran: initialValues?.metode_pembayaran ?? "kas",
        nominal: initialValues?.nominal ?? 0,
        deskripsi: initialValues?.deskripsi ?? "",
        vendor_nama: initialValues?.vendor_nama ?? "",
        nomor_bukti: initialValues?.nomor_bukti ?? "",
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
                    <label className="text-sm font-medium">Kategori Biaya</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.kategori_biaya} onChange={(event) => setData("kategori_biaya", event.target.value)}>
                        {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Metode Pembayaran</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.metode_pembayaran} onChange={(event) => setData("metode_pembayaran", event.target.value)}>
                        <option value="kas">Kas</option>
                        <option value="bank">Bank</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5"><label className="text-sm font-medium">Deskripsi</label><Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} required /></div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><label className="text-sm font-medium">Vendor</label><Input value={data.vendor_nama} onChange={(event) => setData("vendor_nama", event.target.value)} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Nomor Bukti</label><Input value={data.nomor_bukti} onChange={(event) => setData("nomor_bukti", event.target.value)} /></div>
            </div>

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

            {errors.action ? <p className="text-xs text-destructive">{errors.action}</p> : null}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
