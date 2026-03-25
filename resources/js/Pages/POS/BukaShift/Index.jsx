import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/BukaShift/Form";

export default function Index({ activeShift, recentShifts, flashMessage }) {
    const [values, setValues] = useState({
        kasAwal: "",
        catatan: "",
    });

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const submit = (event) => {
        event.preventDefault();

        router.post("/pos/buka-shift", {
            kas_awal: Number(values.kasAwal || 0),
            catatan_buka: values.catatan || null,
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Buka Shift">
            <Head title="POS - Buka Shift" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Shift Aktif" value={activeShift ? "Ya" : "Tidak"} tone="sky" />
                <POSSummaryCard label="Jumlah Riwayat" value={String(recentShifts.length)} tone="slate" />
                <POSSummaryCard label="Kas Awal Form" value={values.kasAwal ? `Rp ${values.kasAwal}` : "Rp 0"} tone="orange" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Mulai Shift Kasir</h2>
                    <p className="mt-1 text-sm text-slate-500">Isi kas awal untuk memulai transaksi pada sesi shift baru.</p>

                    {flashMessage?.success ? (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <Form
                        values={values}
                        state={{ hasActiveShift: !!activeShift }}
                        onChange={handleChange}
                        onSubmit={submit}
                    />
                </section>

                <section className="space-y-4">
                    <article className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700">Shift Aktif</h3>
                        {activeShift ? (
                            <div className="mt-2 space-y-1 text-sm text-slate-700">
                                <p>Kode: <span className="font-semibold">{activeShift.kode}</span></p>
                                <p>Kas Awal: <MoneyText value={activeShift.kas_awal} className="font-semibold" /></p>
                                <p className="flex items-center gap-2">Status: <POSStatusBadge status={activeShift.status} /></p>
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
                                    <p className="text-slate-600">Kas Awal: <MoneyText value={item.kas_awal} /></p>
                                    <p className="mt-1"><POSStatusBadge status={item.status} /></p>
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
