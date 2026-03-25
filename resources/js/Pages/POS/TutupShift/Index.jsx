import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/TutupShift/Form";

export default function Index({ activeShift, flashMessage }) {
    const [kasAktual, setKasAktual] = useState("");
    const [catatan, setCatatan] = useState("");

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

                <Form
                    activeShift={activeShift}
                    kasAktual={kasAktual}
                    catatan={catatan}
                    onChangeKasAktual={setKasAktual}
                    onChangeCatatan={setCatatan}
                    onSubmit={submit}
                />
            </div>
        </POSLayout>
    );
}
