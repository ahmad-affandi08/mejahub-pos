import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import POSLayout from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Index({ activeShift, flashMessage }) {
    const [kasAktual, setKasAktual] = useState("");
    const [catatan, setCatatan] = useState("");

    const selisihPreview = useMemo(() => {
        if (!activeShift) return 0;
        const system = Number(activeShift.kas_sistem ?? activeShift.kas_awal ?? 0);
        return Number(kasAktual || 0) - system;
    }, [activeShift, kasAktual]);

    const submit = (event) => {
        event.preventDefault();

        if (!activeShift) {
            window.alert("Tidak ada shift aktif.");
            return;
        }

        router.post("/pos/tutup-shift", {
            kas_aktual: Number(kasAktual || 0),
            catatan_tutup: catatan || null,
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Tutup Shift">
            <Head title="POS - Tutup Shift" />

            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Closing Shift Kasir</h2>
                <p className="mt-1 text-sm text-slate-500">Rekonsiliasi kas aktual dengan perhitungan sistem.</p>

                {flashMessage?.success ? (
                    <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {flashMessage.success}
                    </p>
                ) : null}

                {!activeShift ? (
                    <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                        Tidak ada shift aktif saat ini.
                    </p>
                ) : (
                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4 text-sm">
                            <p>Kode Shift: <span className="font-semibold">{activeShift.kode}</span></p>
                            <p>Kas Awal: <span className="font-semibold">{currency.format(activeShift.kas_awal)}</span></p>
                            <p>Status: <span className="font-semibold">{activeShift.status}</span></p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Kas Aktual</label>
                            <Input type="number" min="0" value={kasAktual} onChange={(event) => setKasAktual(event.target.value)} required />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Tutup</label>
                            <textarea
                                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={catatan}
                                onChange={(event) => setCatatan(event.target.value)}
                            />
                        </div>

                        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                            Selisih Preview: <span className="font-semibold">{currency.format(selisihPreview)}</span>
                        </div>

                        <Button type="submit" className="w-full">Tutup Shift</Button>
                    </form>
                )}
            </div>
        </POSLayout>
    );
}
