import { Button } from "@/components/ui/button";

export default function Form({ values, state, onChange, onSubmit }) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Void Pesanan</h3>

            <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-700">Order Dipilih</p>
                    <p className="mt-1 text-slate-600">{state.selectedOrder?.kode || "-"}</p>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Alasan Void</label>
                    <textarea
                        className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.alasan}
                        onChange={(event) => onChange("alasan", event.target.value)}
                        placeholder="Contoh: Pesanan dibatalkan pelanggan"
                    />
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!state.selectedOrder}>Proses Void</Button>
            </div>
        </aside>
    );
}
