import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";

export default function Form({
    values,
    state,
    options,
    onChange,
    onSubmit,
}) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Pembayaran</h3>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Metode Bayar</label>
                    <select
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        value={values.metodeBayar}
                        onChange={(event) => onChange("metodeBayar", event.target.value)}
                    >
                        {options.methods.map((item) => (
                            <option key={item.kode} value={item.kode}>{item.nama}</option>
                        ))}
                    </select>
                </div>

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
                        <select
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                            value={values.printerId || ""}
                            onChange={(event) => onChange("printerId", event.target.value)}
                            disabled={!options.printers.length}
                        >
                            <option value="">Pilih printer</option>
                            {options.printers.map((printer) => (
                                <option key={printer.id} value={String(printer.id)}>{printer.nama}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nominal Dibayar</label>
                    <Input
                        type="number"
                        min="0"
                        value={values.nominalDibayar}
                        onChange={(event) => onChange("nominalDibayar", event.target.value)}
                    />
                </div>

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
