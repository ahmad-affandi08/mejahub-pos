import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSLayout from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Index({ activeShift, recentShifts, flashMessage }) {
    const [kasAwal, setKasAwal] = useState("");
    const [catatan, setCatatan] = useState("");

    const submit = (event) => {
        event.preventDefault();

        router.post("/pos/buka-shift", {
            kas_awal: Number(kasAwal || 0),
            catatan_buka: catatan || null,
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Buka Shift">
            <Head title="POS - Buka Shift" />

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Mulai Shift Kasir</h2>
                    <p className="mt-1 text-sm text-slate-500">Isi kas awal untuk memulai transaksi pada sesi shift baru.</p>

                    {flashMessage?.success ? (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <form onSubmit={submit} className="mt-4 space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Kas Awal</label>
                            <Input type="number" min="0" value={kasAwal} onChange={(event) => setKasAwal(event.target.value)} required />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Buka</label>
                            <textarea
                                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={catatan}
                                onChange={(event) => setCatatan(event.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={!!activeShift}>Buka Shift</Button>
                    </form>
                </section>

                <section className="space-y-4">
                    <article className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700">Shift Aktif</h3>
                        {activeShift ? (
                            <div className="mt-2 space-y-1 text-sm text-slate-700">
                                <p>Kode: <span className="font-semibold">{activeShift.kode}</span></p>
                                <p>Kas Awal: <span className="font-semibold">{currency.format(activeShift.kas_awal)}</span></p>
                                <p>Status: <span className="font-semibold">{activeShift.status}</span></p>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-slate-600">Belum ada shift aktif.</p>
                        )}
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Riwayat Shift</h3>
                        <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
                            {recentShifts.length ? recentShifts.map((item) => (
                                <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                                    <p className="font-semibold text-slate-900">{item.kode}</p>
                                    <p className="text-slate-600">Kas Awal: {currency.format(item.kas_awal)}</p>
                                    <p className="text-slate-600">Status: {item.status}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">Belum ada data shift.</p>
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </POSLayout>
    );
}
