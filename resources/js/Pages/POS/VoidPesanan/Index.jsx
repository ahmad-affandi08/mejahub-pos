import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/VoidPesanan/Form";

export default function Index({ orders, logs, flashMessage }) {
    const [values, setValues] = useState({
        selectedOrderId: "",
        alasan: "",
    });

    const selectedOrder = useMemo(
        () => orders.find((item) => String(item.id) === String(values.selectedOrderId)) ?? null,
        [orders, values.selectedOrderId]
    );

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const submit = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        if (!values.alasan.trim()) {
            window.alert("Alasan void wajib diisi.");
            return;
        }

        router.post("/pos/void-pesanan", {
            pesanan_id: selectedOrder.id,
            alasan: values.alasan.trim(),
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Void Pesanan">
            <Head title="POS - Void Pesanan" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Order Eligible" value={String(orders.length)} tone="sky" />
                <POSSummaryCard label="Riwayat Void" value={String(logs.length)} tone="orange" />
                <POSSummaryCard label="Order Dipilih" value={selectedOrder?.kode || "-"} tone="slate" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Pesanan untuk Void</h2>

                    {flashMessage?.success ? (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <div className="mt-3 max-h-[55vh] overflow-auto pr-1">
                        <table className="w-full min-w-170 text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Pilih</th>
                                    <th className="py-2">Kode</th>
                                    <th className="py-2">Pelanggan</th>
                                    <th className="py-2">Status</th>
                                    <th className="py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b last:border-b-0">
                                        <td className="py-2">
                                            <input
                                                type="radio"
                                                name="selected_order"
                                                checked={String(values.selectedOrderId) === String(order.id)}
                                                onChange={() => handleChange("selectedOrderId", String(order.id))}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">{order.kode}</td>
                                        <td className="py-2">{order.nama_pelanggan || "-"}</td>
                                        <td className="py-2"><POSStatusBadge status={order.status} /></td>
                                        <td className="py-2"><MoneyText value={order.total} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Form
                    values={values}
                    state={{ selectedOrder }}
                    onChange={handleChange}
                    onSubmit={submit}
                />
            </div>

            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold">Riwayat Void</h2>
                <div className="mt-3 overflow-auto">
                    <table className="w-full min-w-170 text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-2">Kode</th>
                                <th className="py-2">Pesanan</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((item) => (
                                <tr key={item.id} className="border-b last:border-b-0">
                                    <td className="py-2 font-medium">{item.kode}</td>
                                    <td className="py-2">{item.pesanan_id}</td>
                                    <td className="py-2"><POSStatusBadge status={item.status} /></td>
                                    <td className="py-2">{item.voided_at || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </POSLayout>
    );
}
