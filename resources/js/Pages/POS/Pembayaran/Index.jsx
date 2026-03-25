import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/Pembayaran/Form";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Index({ pendingOrders, activeShift, flashMessage }) {
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [nominalDibayar, setNominalDibayar] = useState("");
    const [metodeBayar, setMetodeBayar] = useState("cash");
    const [catatan, setCatatan] = useState("");

    const selectedOrder = useMemo(
        () => pendingOrders.find((item) => String(item.id) === String(selectedOrderId)) ?? null,
        [pendingOrders, selectedOrderId]
    );

    const kembalian = useMemo(() => {
        if (!selectedOrder) return 0;
        return Number(nominalDibayar || 0) - Number(selectedOrder.total || 0);
    }, [selectedOrder, nominalDibayar]);

    const pay = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        router.post("/pos/pembayaran", {
            pesanan_id: selectedOrder.id,
            metode_bayar: metodeBayar,
            nominal_dibayar: Number(nominalDibayar || 0),
            catatan: catatan || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedOrderId("");
                setNominalDibayar("");
                setCatatan("");
                setMetodeBayar("cash");
            },
        });
    };

    return (
        <POSLayout title="Pembayaran">
            <Head title="POS - Pembayaran" />

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Pesanan Menunggu Bayar</h2>
                        <p className="text-xs text-slate-500">Shift: {activeShift?.kode || "Belum aktif"}</p>
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
                                                checked={String(selectedOrderId) === String(order.id)}
                                                onChange={(event) => {
                                                    setSelectedOrderId(event.target.value);
                                                    setNominalDibayar(String(order.total));
                                                }}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">{order.kode}</td>
                                        <td className="py-2">{order.nama_pelanggan || "-"}</td>
                                        <td className="py-2">{currency.format(order.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Form
                    activeShift={activeShift}
                    selectedOrder={selectedOrder}
                    nominalDibayar={nominalDibayar}
                    metodeBayar={metodeBayar}
                    catatan={catatan}
                    kembalian={kembalian}
                    onChangeMetodeBayar={setMetodeBayar}
                    onChangeNominalDibayar={setNominalDibayar}
                    onChangeCatatan={setCatatan}
                    onSubmit={pay}
                />
            </div>
        </POSLayout>
    );
}
