import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const emptyItem = {
    bahan_baku_id: "",
    qty_pesan: 1,
    harga_satuan: 0,
    catatan: "",
};

export default function Form({ mode, endpoint, initialValues, supplierOptions, bahanBakuOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        supplier_id: initialValues?.supplier_id ?? "",
        kode: initialValues?.kode ?? "",
        tanggal_po: initialValues?.tanggal_po ?? "",
        status: initialValues?.status ?? "draft",
        catatan: initialValues?.catatan ?? "",
        items: initialValues?.items?.length
            ? initialValues.items.map((item) => ({
                bahan_baku_id: item.bahan_baku_id,
                qty_pesan: Number(item.qty_pesan || 0),
                harga_satuan: Number(item.harga_satuan || 0),
                catatan: item.catatan || "",
            }))
            : [emptyItem],
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        };

        if (mode === "edit" && initialValues?.id) {
            transform((payload) => ({ ...payload, _method: "put" }));
            post(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        transform((payload) => payload);
        post(endpoint, options);
    };

    const addItem = () => {
        setData("items", [...data.items, { ...emptyItem }]);
    };

    const removeItem = (index) => {
        if (data.items.length <= 1) return;
        setData("items", data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        setData(
            "items",
            data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Supplier</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.supplier_id}
                        onChange={(event) => setData("supplier_id", event.target.value)}
                    >
                        <option value="">Tanpa supplier</option>
                        {supplierOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.nama}</option>
                        ))}
                    </select>
                    {errors.supplier_id ? <p className="text-xs text-destructive">{errors.supplier_id}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal PO</label>
                    <Input type="date" value={data.tanggal_po || ""} onChange={(event) => setData("tanggal_po", event.target.value)} />
                    {errors.tanggal_po ? <p className="text-xs text-destructive">{errors.tanggal_po}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode (Opsional)</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Auto-generate jika kosong" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.status}
                        onChange={(event) => setData("status", event.target.value)}
                    >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} />
                {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
            </div>

            <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Item PO</p>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>Tambah Item</Button>
                </div>

                {data.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border p-2 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <select
                                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                                value={item.bahan_baku_id}
                                onChange={(event) => updateItem(index, "bahan_baku_id", event.target.value)}
                                required
                            >
                                <option value="">Pilih bahan</option>
                                {bahanBakuOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                type="number"
                                min={0.001}
                                step="0.001"
                                value={item.qty_pesan}
                                onChange={(event) => updateItem(index, "qty_pesan", Number(event.target.value || 0))}
                                placeholder="Qty"
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.harga_satuan}
                                onChange={(event) => updateItem(index, "harga_satuan", Number(event.target.value || 0))}
                                placeholder="Harga"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input value={item.catatan || ""} onChange={(event) => updateItem(index, "catatan", event.target.value)} placeholder="Catatan" />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)} className="w-full">X</Button>
                        </div>
                    </div>
                ))}

                {errors.items ? <p className="text-xs text-destructive">{errors.items}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
