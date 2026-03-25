import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/RefundPesanan/Form";

const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));

function printRefundReceipt(receipt) {
    if (!receipt) return;

    const popup = window.open("", "_blank", "width=420,height=760");

    if (!popup) {
        window.alert("Popup diblokir browser. Izinkan popup untuk cetak struk.");
        return;
    }

    popup.document.write(`
        <html>
        <head><title>Struk ${receipt.kode}</title></head>
        <body style="font-family:monospace;padding:16px;">
            <h3 style="margin:0 0 6px;">MejaHub POS</h3>
            <p style="margin:0 0 12px;">Struk Refund</p>
            <p style="margin:0;">Kode: ${receipt.kode}</p>
            <p style="margin:0;">Waktu: ${receipt.refunded_at || "-"}</p>
            <p style="margin:0;">Kasir: ${receipt.kasir_nama || "-"}</p>
            <p style="margin:0;">Pesanan: ${receipt.pesanan_kode || receipt.pesanan_id || "-"}</p>
            <p style="margin:0;">Metode: ${receipt.metode}</p>
            <hr />
            <p style="margin:0;">Nominal Refund: ${formatCurrency(receipt.nominal)}</p>
            <p style="margin:0;">Alasan: ${receipt.alasan}</p>
        </body>
        </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
}

export default function Index({ orders, logs, flashMessage }) {
    const [values, setValues] = useState({
        selectedOrderId: "",
        nominal: "",
        metode: "cash",
        alasan: "",
    });

    const selectedOrder = useMemo(
        () => orders.find((item) => String(item.id) === String(values.selectedOrderId)) ?? null,
        [orders, values.selectedOrderId]
    );

    const [selectedReceiptId, setSelectedReceiptId] = useState(logs[0]?.id ?? null);

    const selectedReceipt = useMemo(
        () => logs.find((item) => item.id === selectedReceiptId) ?? logs[0] ?? null,
        [logs, selectedReceiptId]
    );

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const chooseOrder = (orderId) => {
        const order = orders.find((item) => String(item.id) === String(orderId));
        setValues((prev) => ({
            ...prev,
            selectedOrderId: String(orderId),
            nominal: order ? String(order.total) : "",
        }));
    };

    const submit = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        if (!values.alasan.trim()) {
            window.alert("Alasan refund wajib diisi.");
            return;
        }

        router.post("/pos/refund-pesanan", {
            pesanan_id: selectedOrder.id,
            nominal: Number(values.nominal || 0),
            metode: values.metode,
            alasan: values.alasan.trim(),
        }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Refund Pesanan">
            <Head title="POS - Refund Pesanan" />

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Order Paid" value={String(orders.length)} tone="sky" />
                <POSSummaryCard label="Riwayat Refund" value={String(logs.length)} tone="orange" />
                <POSSummaryCard label="Order Dipilih" value={selectedOrder?.kode || "-"} tone="slate" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Pesanan Paid</h2>

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
                    onSubmit={submit}
                />
            </div>

            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold">Riwayat Refund & Struk</h2>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="overflow-auto">
                        <table className="w-full min-w-170 text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Preview</th>
                                    <th className="py-2">Kode</th>
                                    <th className="py-2">Pesanan</th>
                                    <th className="py-2">Nominal</th>
                                    <th className="py-2">Status</th>
                                    <th className="py-2">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((item) => (
                                    <tr key={item.id} className="border-b last:border-b-0">
                                        <td className="py-2">
                                            <input
                                                type="radio"
                                                checked={selectedReceipt?.id === item.id}
                                                onChange={() => setSelectedReceiptId(item.id)}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">{item.kode}</td>
                                        <td className="py-2">{item.pesanan_kode || item.pesanan_id}</td>
                                        <td className="py-2"><MoneyText value={item.nominal} /></td>
                                        <td className="py-2"><POSStatusBadge status={item.status} /></td>
                                        <td className="py-2">{item.refunded_at || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Preview Struk Refund</h3>
                        {selectedReceipt ? (
                            <div className="mt-2 space-y-1 text-sm">
                                <p>Kode: <span className="font-semibold">{selectedReceipt.kode}</span></p>
                                <p>Kasir: <span className="font-semibold">{selectedReceipt.kasir_nama || "-"}</span></p>
                                <p>Pesanan: <span className="font-semibold">{selectedReceipt.pesanan_kode || selectedReceipt.pesanan_id}</span></p>
                                <p>Nominal: <MoneyText value={selectedReceipt.nominal} className="font-semibold" /></p>
                                <button
                                    type="button"
                                    onClick={() => printRefundReceipt(selectedReceipt)}
                                    className="mt-2 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white"
                                >
                                    Cetak Struk Refund
                                </button>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-slate-500">Belum ada refund untuk dipreview.</p>
                        )}
                    </div>
                </div>
            </section>
        </POSLayout>
    );
}
