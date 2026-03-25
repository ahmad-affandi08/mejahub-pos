import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Form({
    meja,
    cart,
    subtotal,
    selectedMeja,
    namaPelanggan,
    catatan,
    onSelectMeja,
    onChangeNamaPelanggan,
    onChangeCatatan,
    onDecreaseQty,
    onIncreaseQty,
    onRemoveItem,
    onChangeItemNote,
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
                        value={selectedMeja}
                        onChange={(event) => onSelectMeja(event.target.value)}
                    >
                        <option value="">Takeaway / Tidak pilih meja</option>
                        {meja.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nama}{item.nomor_meja ? ` (${item.nomor_meja})` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nama Pelanggan</label>
                    <Input value={namaPelanggan} onChange={(event) => onChangeNamaPelanggan(event.target.value)} />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Pesanan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={catatan}
                        onChange={(event) => onChangeCatatan(event.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 max-h-[44vh] space-y-2 overflow-auto pr-1">
                {cart.length ? cart.map((item) => (
                    <div key={item.data_menu_id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.nama_menu}</p>
                                <p className="text-xs text-slate-500">{currency.format(item.harga)}</p>
                            </div>
                            <button type="button" className="text-xs text-rose-600" onClick={() => onRemoveItem(item.data_menu_id)}>
                                Hapus
                            </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => onDecreaseQty(item.data_menu_id)}>-</Button>
                            <span className="text-sm font-semibold">{item.qty}</span>
                            <Button type="button" variant="outline" size="sm" onClick={() => onIncreaseQty(item.data_menu_id)}>+</Button>
                        </div>

                        <Input
                            className="mt-2"
                            placeholder="Catatan item (opsional)"
                            value={item.catatan}
                            onChange={(event) => onChangeItemNote(item.data_menu_id, event.target.value)}
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
                    <span className="font-semibold">{currency.format(subtotal)}</span>
                </div>
                <Button className="w-full" onClick={onSubmit}>Simpan Pesanan</Button>
            </div>
        </aside>
    );
}
