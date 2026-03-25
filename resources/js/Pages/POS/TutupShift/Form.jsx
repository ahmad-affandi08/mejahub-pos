import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";

export default function Form({ values, state, onChange, onSubmit }) {
    const activeShift = state.activeShift;

    const selisihPreview = useMemo(() => {
        if (!activeShift) return 0;
        const system = Number(activeShift.kas_sistem ?? activeShift.kas_awal ?? 0);
        return Number(values.kasAktual || 0) - system;
    }, [activeShift, values.kasAktual]);

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
                <p>Kas Awal: <MoneyText value={activeShift.kas_awal} className="font-semibold" /></p>
                <p className="flex items-center gap-2">Status: <POSStatusBadge status={activeShift.status} /></p>
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Kas Aktual</label>
                <Input
                    type="number"
                    min="0"
                    value={values.kasAktual}
                    onChange={(event) => onChange("kasAktual", event.target.value)}
                    required
                />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Tutup</label>
                <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={values.catatan}
                    onChange={(event) => onChange("catatan", event.target.value)}
                />
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                Selisih Preview: <MoneyText value={selisihPreview} className="font-semibold" />
            </div>

            <Button type="submit" className="w-full">Tutup Shift</Button>
        </form>
    );
}
