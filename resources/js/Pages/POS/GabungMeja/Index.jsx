import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/GabungMeja/Form";

export default function Index({ orders, logs, flashMessage }) {
    const [values, setValues] = useState({
        targetId: "",
        sourceIds: [],
        catatan: "",
    });

    const sourceCandidates = useMemo(() => {
        if (!values.targetId) return [];
        return orders.filter((item) => String(item.id) !== String(values.targetId));
    }, [orders, values.targetId]);

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const chooseTarget = (id) => {
        setValues((prev) => ({
            ...prev,
            targetId: String(id),
            sourceIds: prev.sourceIds.filter((item) => String(item) !== String(id)),
        }));
    };

    const toggleSource = (id) => {
        setValues((prev) => {
            const exists = prev.sourceIds.includes(id);
            return {
                ...prev,
                sourceIds: exists
                    ? prev.sourceIds.filter((item) => item !== id)
                    : [...prev.sourceIds, id],
            };
        });
    };

    const submit = () => {
        if (!values.targetId) {
            window.alert("Pilih pesanan target terlebih dahulu.");
            return;
        }

        if (!values.sourceIds.length) {
            window.alert("Pilih minimal satu pesanan sumber.");
            return;
        }

        router.post("/pos/gabung-meja", {
            pesanan_target_id: Number(values.targetId),
            pesanan_sumber_ids: values.sourceIds,
            catatan: values.catatan || null,
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Gabung Meja">
            <Head title="POS - Gabung Meja" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Submitted Order" value={String(orders.length)} tone="sky" />
                <POSSummaryCard label="Sumber Dipilih" value={String(values.sourceIds.length)} tone="orange" />
                <POSSummaryCard label="Riwayat Gabung" value={String(logs.length)} tone="slate" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Pilih Pesanan Target</h2>

                    {flashMessage?.success ? (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <div className="mt-3 max-h-[55vh] overflow-auto pr-1">
                        <table className="w-full min-w-170 text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Target</th>
                                    <th className="py-2">Kode</th>
                                    <th className="py-2">Pelanggan</th>
                                    <th className="py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b last:border-b-0">
                                        <td className="py-2">
                                            <input
                                                type="radio"
                                                name="target_order"
                                                checked={String(values.targetId) === String(order.id)}
                                                onChange={() => chooseTarget(order.id)}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">{order.kode}</td>
                                        <td className="py-2">{order.nama_pelanggan || "-"}</td>
                                        <td className="py-2"><MoneyText value={order.total} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Form
                    values={values}
                    state={{ sourceCandidates }}
                    onChange={handleChange}
                    onToggleSource={toggleSource}
                    onSubmit={submit}
                />
            </div>

            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold">Riwayat Gabung</h2>
                <div className="mt-3 overflow-auto">
                    <table className="w-full min-w-170 text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-2">ID</th>
                                <th className="py-2">Target</th>
                                <th className="py-2">Sumber</th>
                                <th className="py-2">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((item) => (
                                <tr key={item.id} className="border-b last:border-b-0">
                                    <td className="py-2">#{item.id}</td>
                                    <td className="py-2">{item.pesanan_target_id}</td>
                                    <td className="py-2">{item.pesanan_sumber_ids.join(", ") || "-"}</td>
                                    <td className="py-2">{item.merged_at || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </POSLayout>
    );
}
