import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/Pembayaran/Form";

const formatCurrency = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));

function printReceipt(receipt, printerName = null) {
    if (!receipt) return;

    const popup = window.open("", "_blank", "width=420,height=760");

    if (!popup) {
        window.alert("Popup diblokir browser. Izinkan popup untuk cetak struk.");
        return;
    }

    const itemsHtml = (receipt.items || []).map((item) => `
        <tr>
            <td>${item.nama_menu}</td>
            <td style="text-align:center;">${item.qty}</td>
            <td style="text-align:right;">${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join("");

    const paymentDetailHtml = (receipt.payment_details || []).map((detail) => `
        <p style="margin:0;">${detail.metode_bayar}: ${formatCurrency(detail.nominal)}</p>
    `).join("");

    popup.document.write(`
        <html>
        <head><title>Struk ${receipt.kode_transaksi}</title></head>
        <body style="font-family:monospace;padding:16px;">
            <h3 style="margin:0 0 6px;">MejaHub POS</h3>
            <p style="margin:0 0 12px;">Struk Pembayaran</p>
            <p style="margin:0;">Kode: ${receipt.kode_transaksi}</p>
            <p style="margin:0;">Waktu: ${receipt.waktu || "-"}</p>
            <p style="margin:0;">Kasir: ${receipt.kasir || "-"}</p>
            <p style="margin:0;">Printer: ${printerName || "Default"}</p>
            <p style="margin:0;">Pesanan: ${receipt.pesanan_kode || "-"}</p>
            <hr />
            <table style="width:100%;border-collapse:collapse;" cellpadding="4">
                <thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Subtotal</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <hr />
            <p style="margin:0;">Tagihan: ${formatCurrency(receipt.nominal_tagihan)}</p>
            <p style="margin:0;">Dibayar: ${formatCurrency(receipt.nominal_dibayar)}</p>
            <p style="margin:0;">Kembalian: ${formatCurrency(receipt.kembalian)}</p>
            ${paymentDetailHtml ? `<hr /><p style="margin:0 0 6px;">Rincian Pembayaran:</p>${paymentDetailHtml}` : ""}
        </body>
        </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
}

export default function Index({ pendingOrders, activeShift, recentPayments = [], flashMessage, paymentConfig }) {
    const methods = paymentConfig?.methods ?? [];
    const printers = paymentConfig?.printers ?? [];
    const defaultMethod = paymentConfig?.default_method_code ?? methods[0]?.kode ?? "";
    const defaultPrinterId = paymentConfig?.default_printer_id ? String(paymentConfig.default_printer_id) : "";

    const [values, setValues] = useState({
        selectedOrderId: "",
        nominalDibayar: "",
        metodeBayar: defaultMethod,
        isSplitPayment: false,
        paymentDetails: [],
        autoPrint: Boolean(paymentConfig?.auto_print_default),
        printerId: defaultPrinterId,
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
        const splitTotal = (values.paymentDetails || []).reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        const paid = values.isSplitPayment ? splitTotal : Number(values.nominalDibayar || 0);

        return paid - Number(selectedOrder.total || 0);
    }, [selectedOrder, values.isSplitPayment, values.nominalDibayar, values.paymentDetails]);

    const [selectedReceiptId, setSelectedReceiptId] = useState(recentPayments[0]?.id ?? null);

    const selectedReceipt = useMemo(
        () => recentPayments.find((item) => item.id === selectedReceiptId) ?? recentPayments[0] ?? null,
        [recentPayments, selectedReceiptId]
    );

    const pay = () => {
        if (!selectedOrder) {
            window.alert("Pilih pesanan terlebih dahulu.");
            return;
        }

        if (values.isSplitPayment) {
            const details = (values.paymentDetails || []).filter((item) => item.metode_bayar && Number(item.nominal || 0) > 0);

            if (details.length === 0) {
                window.alert("Isi minimal satu rincian split payment.");
                return;
            }

            const totalSplit = details.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

            if (totalSplit < Number(selectedOrder.total || 0)) {
                window.alert("Total split payment kurang dari total tagihan.");
                return;
            }
        } else if (Number(values.nominalDibayar || 0) < Number(selectedOrder.total || 0)) {
            window.alert("Nominal dibayar kurang dari total tagihan.");
            return;
        }

        router.post("/pos/pembayaran", {
            pesanan_id: selectedOrder.id,
            metode_bayar: values.isSplitPayment ? null : values.metodeBayar,
            nominal_dibayar: values.isSplitPayment ? null : Number(values.nominalDibayar || 0),
            payment_details: values.isSplitPayment ? (values.paymentDetails || []).map((item) => ({
                metode_bayar: item.metode_bayar,
                nominal: Number(item.nominal || 0),
            })) : [],
            catatan: values.catatan || null,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const latestPayment = page?.props?.recentPayments?.[0] ?? null;
                const selectedPrinter = printers.find((item) => String(item.id) === String(values.printerId)) ?? printers[0] ?? null;

                if (values.autoPrint && latestPayment) {
                    printReceipt({
                        ...latestPayment,
                        kode_transaksi: latestPayment.kode,
                        waktu: latestPayment.waktu_bayar,
                        kasir: latestPayment.kasir_nama,
                    }, selectedPrinter?.nama || null);
                }

                setValues({
                    selectedOrderId: "",
                    nominalDibayar: "",
                    metodeBayar: defaultMethod,
                    isSplitPayment: false,
                    paymentDetails: [],
                    autoPrint: Boolean(paymentConfig?.auto_print_default),
                    printerId: defaultPrinterId,
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
                                                    if (values.isSplitPayment && (!values.paymentDetails || values.paymentDetails.length === 0)) {
                                                        handleChange("paymentDetails", [{ metode_bayar: defaultMethod, nominal: String(order.total) }]);
                                                    }
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
                    options={{
                        methods,
                        printers,
                    }}
                    onChange={handleChange}
                    onSubmit={pay}
                />
            </div>

            <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Riwayat Pembayaran</h2>
                        <span className="text-xs text-slate-500">Struk tersedia untuk preview/cetak</span>
                    </div>

                    <div className="max-h-[38vh] overflow-auto pr-1">
                        <table className="w-full min-w-180 text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Preview</th>
                                    <th className="py-2">Kode</th>
                                    <th className="py-2">Pesanan</th>
                                    <th className="py-2">Metode</th>
                                    <th className="py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((item) => (
                                    <tr key={item.id} className="border-b last:border-b-0">
                                        <td className="py-2">
                                            <input
                                                type="radio"
                                                checked={selectedReceipt?.id === item.id}
                                                onChange={() => setSelectedReceiptId(item.id)}
                                            />
                                        </td>
                                        <td className="py-2 font-medium">{item.kode}</td>
                                        <td className="py-2">{item.pesanan_kode || "-"}</td>
                                        <td className="py-2">{item.metode_bayar}</td>
                                        <td className="py-2"><MoneyText value={item.nominal_tagihan} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900">Preview Struk</h3>
                    {selectedReceipt ? (
                        <div className="mt-3 space-y-2 text-sm">
                            <p>Kode: <span className="font-semibold">{selectedReceipt.kode}</span></p>
                            <p>Kasir: <span className="font-semibold">{selectedReceipt.kasir_nama || "-"}</span></p>
                            <p>Pesanan: <span className="font-semibold">{selectedReceipt.pesanan_kode || "-"}</span></p>
                            <p>Meja: <span className="font-semibold">{selectedReceipt.meja_nama || "-"}</span></p>
                            <p>Total: <MoneyText value={selectedReceipt.nominal_tagihan} className="font-semibold" /></p>
                            <button
                                type="button"
                                onClick={() => printReceipt({
                                    ...selectedReceipt,
                                    kode_transaksi: selectedReceipt.kode,
                                    waktu: selectedReceipt.waktu_bayar,
                                    kasir: selectedReceipt.kasir_nama,
                                    nominal_tagihan: selectedReceipt.nominal_tagihan,
                                    nominal_dibayar: selectedReceipt.nominal_dibayar,
                                    kembalian: selectedReceipt.kembalian,
                                    payment_details: selectedReceipt.payment_details,
                                    items: selectedReceipt.items ?? [],
                                })}
                                className="mt-2 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                Cetak Struk
                            </button>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500">Belum ada pembayaran untuk dipreview.</p>
                    )}
                </article>
            </section>
        </POSLayout>
    );
}
