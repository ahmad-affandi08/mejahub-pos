import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";

const methods = [
    { value: "cash", label: "Cash" },
    { value: "transfer", label: "Transfer" },
    { value: "qris", label: "QRIS" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
];

export default function Form({ values, state, onChange, onSubmit }) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Refund</h3>

            <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>Total Order: <MoneyText value={state.selectedOrder?.total || 0} className="font-semibold" /></p>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Metode Refund</label>
                    <select
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        value={values.metode}
                        onChange={(event) => onChange("metode", event.target.value)}
                    >
                        {methods.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nominal Refund</label>
                    <Input
                        type="number"
                        min="0"
                        value={values.nominal}
                        onChange={(event) => onChange("nominal", event.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Alasan Refund</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.alasan}
                        onChange={(event) => onChange("alasan", event.target.value)}
                    />
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!state.selectedOrder}>Proses Refund</Button>
            </div>
        </aside>
    );
}
