import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const emptyItem = {
    purchase_order_item_id: "",
    bahan_baku_id: "",
    qty_diterima: 1,
    harga_satuan: 0,
    catatan: "",
};

export default function Form({ endpoint, purchaseOrderOptions, supplierOptions, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        purchase_order_id: "",
        supplier_id: "",
        kode: "",
        nomor_surat_jalan: "",
        tanggal_terima: "",
        status: "received",
        catatan: "",
        items: [emptyItem],
    });

    const submit = (event) => {
        event.preventDefault();

        post(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        });
    };

    const addItem = () => setData("items", [...data.items, { ...emptyItem }]);

    const removeItem = (index) => {
        if (data.items.length <= 1) return;
        setData("items", data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        setData("items", data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Purchase Order</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.purchase_order_id} onChange={(event) => setData("purchase_order_id", event.target.value)}>
                        <option value="">Tanpa PO</option>
                        {purchaseOrderOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.kode}</option>
                        ))}
                    </select>
                    {errors.purchase_order_id ? <p className="text-xs text-destructive">{errors.purchase_order_id}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Supplier</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.supplier_id} onChange={(event) => setData("supplier_id", event.target.value)}>
                        <option value="">Tanpa supplier</option>
                        {supplierOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.nama}</option>
                        ))}
                    </select>
                    {errors.supplier_id ? <p className="text-xs text-destructive">{errors.supplier_id}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode (Opsional)</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Auto-generate jika kosong" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Surat Jalan</label>
                    <Input value={data.nomor_surat_jalan} onChange={(event) => setData("nomor_surat_jalan", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Terima</label>
                    <Input type="date" value={data.tanggal_terima} onChange={(event) => setData("tanggal_terima", event.target.value)} />
                </div>
            </div>

            <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Item Penerimaan</p>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>Tambah Item</Button>
                </div>

                {data.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border p-2 md:grid-cols-12">
                        <div className="md:col-span-3">
                            <Input value={item.purchase_order_item_id || ""} onChange={(event) => updateItem(index, "purchase_order_item_id", event.target.value)} placeholder="PO Item ID (opsional)" />
                        </div>
                        <div className="md:col-span-3">
                            <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={item.bahan_baku_id} onChange={(event) => updateItem(index, "bahan_baku_id", event.target.value)} required>
                                <option value="">Pilih bahan</option>
                                {bahanBakuOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <Input type="number" min={0.001} step="0.001" value={item.qty_diterima} onChange={(event) => updateItem(index, "qty_diterima", Number(event.target.value || 0))} placeholder="Qty" required />
                        </div>
                        <div className="md:col-span-2">
                            <Input type="number" min={0} step="0.01" value={item.harga_satuan} onChange={(event) => updateItem(index, "harga_satuan", Number(event.target.value || 0))} placeholder="Harga" required />
                        </div>
                        <div className="md:col-span-1">
                            <Input value={item.catatan || ""} onChange={(event) => updateItem(index, "catatan", event.target.value)} placeholder="Catatan" />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)} className="w-full">X</Button>
                        </div>
                    </div>
                ))}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
