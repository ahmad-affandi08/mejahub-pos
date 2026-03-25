import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Form({ activeShift, kasAktual, catatan, onChangeKasAktual, onChangeCatatan, onSubmit }) {
    const selisihPreview = useMemo(() => {
        if (!activeShift) return 0;
        const system = Number(activeShift.kas_sistem ?? activeShift.kas_awal ?? 0);
        return Number(kasAktual || 0) - system;
    }, [activeShift, kasAktual]);

    if (!activeShift) {
        return (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                Tidak ada shift aktif saat ini.
            </p>
        );
    }

    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p>Kode Shift: <span className="font-semibold">{activeShift.kode}</span></p>
                <p>Kas Awal: <span className="font-semibold">{currency.format(activeShift.kas_awal)}</span></p>
                <p>Status: <span className="font-semibold">{activeShift.status}</span></p>
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Kas Aktual</label>
                <Input type="number" min="0" value={kasAktual} onChange={(event) => onChangeKasAktual(event.target.value)} required />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Tutup</label>
                <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={catatan}
                    onChange={(event) => onChangeCatatan(event.target.value)}
                />
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                Selisih Preview: <span className="font-semibold">{currency.format(selisihPreview)}</span>
            </div>

            <Button type="submit" className="w-full">Tutup Shift</Button>
        </form>
    );
}
