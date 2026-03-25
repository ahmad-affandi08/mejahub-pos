import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const methods = [
    { value: "cash", label: "Cash" },
    { value: "qris", label: "QRIS" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit Card" },
    { value: "transfer", label: "Transfer" },
];

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Form({
    activeShift,
    selectedOrder,
    nominalDibayar,
    metodeBayar,
    catatan,
    kembalian,
    onChangeMetodeBayar,
    onChangeNominalDibayar,
    onChangeCatatan,
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
                        value={metodeBayar}
                        onChange={(event) => onChangeMetodeBayar(event.target.value)}
                    >
                        {methods.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nominal Dibayar</label>
                    <Input
                        type="number"
                        min="0"
                        value={nominalDibayar}
                        onChange={(event) => onChangeNominalDibayar(event.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={catatan}
                        onChange={(event) => onChangeCatatan(event.target.value)}
                    />
                </div>

                <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p>Total Tagihan: <span className="font-semibold">{currency.format(selectedOrder?.total || 0)}</span></p>
                    <p>Kembalian: <span className="font-semibold">{currency.format(kembalian)}</span></p>
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!activeShift}>Proses Pembayaran</Button>
                {!activeShift ? (
                    <p className="text-xs text-rose-600">Buka shift dulu sebelum proses pembayaran.</p>
                ) : null}
            </div>
        </aside>
    );
}
