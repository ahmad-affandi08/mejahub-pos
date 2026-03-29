import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";

export default function Form({
    values,
    state,
    options,
    onChange,
    onSubmit,
}) {
    const splitTotal = (values.paymentDetails || []).reduce((sum, item) => sum + Number(item.nominal || 0), 0);

    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Pembayaran</h3>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Metode Bayar</label>
                    <SearchableSelect
                        value={values.isSplitPayment ? "split" : values.metodeBayar}
                        onChange={(value) => {
                            if (value === "split") {
                                onChange("isSplitPayment", true);
                                return;
                            }

                            onChange("isSplitPayment", false);
                            onChange("metodeBayar", value);
                        }}
                        placeholder="Pilih metode bayar"
                        searchPlaceholder="Cari metode bayar..."
                        emptyText="Metode tidak ditemukan"
                        triggerClassName="h-9 rounded-md border-slate-300 bg-white px-3 text-sm"
                        options={[
                            { value: "split", label: "Split Payment (Multi Metode)" },
                            ...options.methods.map((item) => ({
                                value: item.kode,
                                label: item.nama,
                                keywords: item.kode,
                            })),
                        ]}
                    />
                </div>

                {values.isSplitPayment ? (
                    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-600">Rincian Split Payment</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onChange("paymentDetails", [
                                    ...(values.paymentDetails || []),
                                    { metode_bayar: options.methods[0]?.kode || "", nominal: 0 },
                                ])}
                            >
                                Tambah Baris
                            </Button>
                        </div>

                        {(values.paymentDetails || []).map((item, index) => (
                            <div key={`split-${index}`} className="grid grid-cols-12 gap-2">
                                <div className="col-span-7">
                                    <SearchableSelect
                                        value={item.metode_bayar}
                                        onChange={(value) => {
                                            const next = [...(values.paymentDetails || [])];
                                            next[index] = { ...next[index], metode_bayar: value };
                                            onChange("paymentDetails", next);
                                        }}
                                        placeholder="Pilih metode"
                                        searchPlaceholder="Cari metode..."
                                        emptyText="Metode tidak ditemukan"
                                        triggerClassName="h-9 rounded-md border-slate-300 bg-white px-2 text-sm"
                                        options={options.methods.map((method) => ({
                                            value: method.kode,
                                            label: method.nama,
                                            keywords: method.kode,
                                        }))}
                                    />
                                </div>
                                <Input
                                    className="col-span-4"
                                    type="number"
                                    min="0"
                                    value={item.nominal}
                                    onChange={(event) => {
                                        const next = [...(values.paymentDetails || [])];
                                        next[index] = { ...next[index], nominal: event.target.value };
                                        onChange("paymentDetails", next);
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="col-span-1 px-0 text-rose-600"
                                    onClick={() => {
                                        const next = (values.paymentDetails || []).filter((_, idx) => idx !== index);
                                        onChange("paymentDetails", next);
                                    }}
                                >
                                    x
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Auto Print</label>
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                            value={values.autoPrint ? "1" : "0"}
                            onChange={(event) => onChange("autoPrint", event.target.value === "1")}
                        >
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Printer</label>
                        <SearchableSelect
                            value={values.printerId || ""}
                            onChange={(value) => onChange("printerId", value)}
                            placeholder="Pilih printer"
                            searchPlaceholder="Cari printer..."
                            emptyText="Printer tidak ditemukan"
                            disabled={!options.printers.length}
                            triggerClassName="h-9 rounded-md border-slate-300 bg-white px-3 text-sm"
                            options={[
                                { value: "", label: "Pilih printer" },
                                ...options.printers.map((printer) => ({
                                    value: String(printer.id),
                                    label: printer.nama,
                                })),
                            ]}
                        />
                    </div>
                </div>

                {!values.isSplitPayment ? (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Nominal Dibayar</label>
                        <Input
                            type="number"
                            min="0"
                            value={values.nominalDibayar}
                            onChange={(event) => onChange("nominalDibayar", event.target.value)}
                        />
                    </div>
                ) : null}

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.catatan}
                        onChange={(event) => onChange("catatan", event.target.value)}
                    />
                </div>

                <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>Total Tagihan: <MoneyText value={state.selectedOrder?.total || 0} className="font-semibold" /></p>
                    {values.isSplitPayment ? (
                        <p>Total Split: <MoneyText value={splitTotal} className="font-semibold" /></p>
                    ) : null}
                    <p>Kembalian: <MoneyText value={state.kembalian} className="font-semibold" /></p>
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!state.hasActiveShift || !options.methods.length}>Proses Pembayaran</Button>
                {!state.hasActiveShift ? (
                    <p className="text-xs text-rose-600">Buka shift dulu sebelum proses pembayaran.</p>
                ) : null}
                {!options.methods.length ? (
                    <p className="text-xs text-rose-600">Belum ada metode pembayaran aktif di Settings.</p>
                ) : null}
            </div>
        </aside>
    );
}
