import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ReconcileForm({ endpoint, onSuccess, onCancel }) {
    const { data, setData, post, processing, errors } = useForm({
        entry_type: "rekonsiliasi",
        tanggal: "",
        jenis_akun: "kas",
        saldo_aktual: 0,
        catatan: "",
    });

    const submit = (event) => {
        event.preventDefault();

        post(endpoint, {
            preserveScroll: true,
            onSuccess: () => onSuccess?.(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Rekonsiliasi</label>
                    <Input type="date" value={data.tanggal} onChange={(event) => setData("tanggal", event.target.value)} required />
                    {errors.tanggal ? <p className="text-xs text-destructive">{errors.tanggal}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Akun</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.jenis_akun} onChange={(event) => setData("jenis_akun", event.target.value)}>
                        <option value="kas">Kas</option>
                        <option value="bank">Bank</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Saldo Aktual</label>
                <Input type="number" min={0} step="0.01" value={data.saldo_aktual} onChange={(event) => setData("saldo_aktual", Number(event.target.value || 0))} required />
                {errors.saldo_aktual ? <p className="text-xs text-destructive">{errors.saldo_aktual}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan Rekonsiliasi"}</Button>
            </DialogFooter>
        </form>
    );
}
