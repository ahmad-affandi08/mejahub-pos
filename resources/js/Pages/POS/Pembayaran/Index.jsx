import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/Pembayaran/Form";

export default function Index({ pendingOrders, activeShift, flashMessage }) {
    const [values, setValues] = useState({
        selectedOrderId: "",
        nominalDibayar: "",
        metodeBayar: "cash",
        catatan: "",
    });

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const selectedOrder = useMemo(
        () => pendingOrders.find((item) => String(item.id) === String(values.selectedOrderId)) ?? null,
        [pendingOrders, values.selectedOrderId]
    );

    const kembalian = useMemo(() => {
        if (!selectedOrder) return 0;
        return Number(values.nominalDibayar || 0) - Number(selectedOrder.total || 0);
    }, [selectedOrder, values.nominalDibayar]);

    const pay = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        router.post("/pos/pembayaran", {
            pesanan_id: selectedOrder.id,
            metode_bayar: values.metodeBayar,
            nominal_dibayar: Number(values.nominalDibayar || 0),
            catatan: values.catatan || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setValues({
                    selectedOrderId: "",
                    nominalDibayar: "",
                    metodeBayar: "cash",
                    catatan: "",
                });
            },
        });
    };

    return (
        <POSLayout title="Pembayaran">
            <Head title="POS - Pembayaran" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Pending Bayar" value={String(pendingOrders.length)} tone="orange" />
                <POSSummaryCard label="Shift Aktif" value={activeShift ? "Ya" : "Tidak"} tone="sky" />
                <POSSummaryCard label="Nominal Input" value={<MoneyText value={values.nominalDibayar || 0} />} tone="emerald" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Pesanan Menunggu Bayar</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Shift: {activeShift?.kode || "Belum aktif"}</span>
                            {activeShift ? <POSStatusBadge status={activeShift.status} /> : null}
                        </div>
                    </div>

                    {flashMessage?.success ? (
                        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <div className="max-h-[62vh] overflow-auto pr-1">
                        <table className="w-full min-w-180 text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Pilih</th>
                                    <th className="py-2">Kode</th>
                                    <th className="py-2">Pelanggan</th>
                                    <th className="py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingOrders.map((order) => (
                                    <tr key={order.id} className="border-b last:border-b-0">
                                        <td className="py-2">
                                            <input
                                                type="radio"
                                                name="selected_order"
                                                value={order.id}
                                                checked={String(values.selectedOrderId) === String(order.id)}
                                                onChange={(event) => {
                                                    handleChange("selectedOrderId", event.target.value);
                                                    handleChange("nominalDibayar", String(order.total));
                                                }}
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
                    state={{
                        selectedOrder,
                        kembalian,
                        hasActiveShift: !!activeShift,
                    }}
                    onChange={handleChange}
                    onSubmit={pay}
                />
            </div>
        </POSLayout>
    );
}
