import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";

export default function Form({ values, state, onChange, onQtyChange, onSubmit }) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Split Bill</h3>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.catatan}
                        onChange={(event) => onChange("catatan", event.target.value)}
                        placeholder="Contoh: Pisah tagihan untuk tamu kedua"
                    />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Dipindahkan</p>
                    <div className="mt-2 space-y-2">
                        {state.selectedOrder?.items?.length ? state.selectedOrder.items.map((item) => (
                            <div key={item.id} className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">
                                <p className="font-medium text-slate-900">{item.nama_menu}</p>
                                <p className="text-xs text-slate-500">Maks: {item.qty} | Harga: <MoneyText value={item.harga_satuan} /></p>
                                <Input
                                    type="number"
                                    min="0"
                                    max={item.qty}
                                    value={values.itemQty[item.id] ?? 0}
                                    onChange={(event) => onQtyChange(item.id, event.target.value, item.qty)}
                                    className="mt-2"
                                />
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">Pilih pesanan untuk mulai split.</p>
                        )}
                    </div>
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!state.selectedOrder}>Proses Split</Button>
            </div>
        </aside>
    );
}
