import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyText from "@/components/shared/pos/MoneyText";

export default function Form({
    values,
    options,
    state,
    taxState,
    handlers,
    onChange,
    onSubmit,
}) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Keranjang</h2>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Meja</label>
                    <select
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        value={values.selectedMeja}
                        onChange={(event) => onChange("selectedMeja", event.target.value)}
                    >
                        <option value="">Takeaway / Tidak pilih meja</option>
                        {options.meja.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nama}{item.nomor_meja ? ` (${item.nomor_meja})` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nama Pelanggan</label>
                    <Input value={values.namaPelanggan} onChange={(event) => onChange("namaPelanggan", event.target.value)} />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Pesanan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.catatan}
                        onChange={(event) => onChange("catatan", event.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 max-h-[44vh] space-y-2 overflow-auto pr-1">
                {values.cart.length ? values.cart.map((item) => (
                    <div key={item.data_menu_id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.nama_menu}</p>
                                <p className="text-xs text-slate-500"><MoneyText value={item.harga} /></p>
                            </div>
                            <button type="button" className="text-xs text-rose-600" onClick={() => handlers.onRemoveItem(item.data_menu_id)}>
                                Hapus
                            </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handlers.onDecreaseQty(item.data_menu_id)}>-</Button>
                            <span className="text-sm font-semibold">{item.qty}</span>
                            <Button type="button" variant="outline" size="sm" onClick={() => handlers.onIncreaseQty(item.data_menu_id)}>+</Button>
                        </div>

                        <Input
                            className="mt-2"
                            placeholder="Catatan item (opsional)"
                            value={item.catatan}
                            onChange={(event) => handlers.onChangeItemNote(item.data_menu_id, event.target.value)}
                        />
                    </div>
                )) : (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                        Belum ada item di keranjang.
                    </p>
                )}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <MoneyText value={state.subtotal} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                        Pajak {taxState?.taxConfig?.nama ? `(${taxState.taxConfig.nama})` : ""}
                    </span>
                    <MoneyText value={taxState?.pajak || 0} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-900 font-semibold">Total</span>
                    <MoneyText value={taxState?.totalTagihan || state.subtotal} className="font-semibold text-slate-900" />
                </div>
                <Button className="w-full" onClick={onSubmit}>Simpan Pesanan</Button>
            </div>
        </aside>
    );
}
