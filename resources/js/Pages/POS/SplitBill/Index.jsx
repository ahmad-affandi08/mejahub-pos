import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/SplitBill/Form";

export default function Index({ orders, logs, flashMessage }) {
    const [values, setValues] = useState({
        selectedOrderId: "",
        itemQty: {},
        catatan: "",
    });

    const selectedOrder = useMemo(
        () => orders.find((item) => String(item.id) === String(values.selectedOrderId)) ?? null,
        [orders, values.selectedOrderId]
    );

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleQtyChange = (itemId, value, max) => {
        const qty = Math.max(0, Math.min(Number(value || 0), Number(max || 0)));
        setValues((prev) => ({
            ...prev,
            itemQty: { ...prev.itemQty, [itemId]: qty },
        }));
    };

    const chooseOrder = (orderId) => {
        const order = orders.find((item) => String(item.id) === String(orderId));
        const nextQty = {};

        if (order) {
            order.items.forEach((item) => {
                nextQty[item.id] = 0;
            });
        }

        setValues((prev) => ({
            ...prev,
            selectedOrderId: String(orderId),
            itemQty: nextQty,
        }));
    };

    const submit = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        const items = Object.entries(values.itemQty)
            .map(([pesananItemId, qty]) => ({
                pesanan_item_id: Number(pesananItemId),
                qty: Number(qty || 0),
            }))
            .filter((item) => item.qty > 0);

        if (!items.length) {
            window.alert("Isi qty split minimal pada satu item.");
            return;
        }

        router.post("/pos/split-bill", {
            pesanan_id: Number(values.selectedOrderId),
            catatan: values.catatan || null,
            items,
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Split Bill">
            <Head title="POS - Split Bill" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Submitted Order" value={String(orders.length)} tone="sky" />
                <POSSummaryCard label="Riwayat Split" value={String(logs.length)} tone="orange" />
                <POSSummaryCard label="Order Dipilih" value={selectedOrder?.kode || "-"} tone="slate" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Pesanan Submitted</h2>

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
                                                onChange={() => chooseOrder(order.id)}
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
                    state={{ selectedOrder }}
                    onChange={handleChange}
                    onQtyChange={handleQtyChange}
                    onSubmit={submit}
                />
            </div>

            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold">Riwayat Split Bill</h2>
                <div className="mt-3 overflow-auto">
                    <table className="w-full min-w-170 text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-2">ID</th>
                                <th className="py-2">Asal</th>
                                <th className="py-2">Baru</th>
                                <th className="py-2">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((item) => (
                                <tr key={item.id} className="border-b last:border-b-0">
                                    <td className="py-2">#{item.id}</td>
                                    <td className="py-2">{item.pesanan_asal_id}</td>
                                    <td className="py-2">{item.pesanan_baru_id}</td>
                                    <td className="py-2">{item.split_at || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </POSLayout>
    );
}
