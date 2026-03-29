import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const emptyItem = {
    purchase_order_item_id: "",
    bahan_baku_id: "",
    qty_input: 1,
    satuan_input: "",
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
        status_pembayaran: "unpaid",
        metode_pembayaran: "kas",
        akun_kas_id: "",
        jatuh_tempo: "",
        jumlah_dibayar: 0,
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
        setData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        }));
    };

    const patchItem = (index, patch) => {
        setData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    };

    const resolveBahan = (bahanId) => bahanBakuOptions.find((opt) => String(opt.id) === String(bahanId));

    const unitOptions = (bahan) => {
        if (!bahan) return [];
        const kecil = bahan.satuan_kecil || bahan.satuan;
        const besar = bahan.satuan_besar;
        return [kecil, besar].filter(Boolean);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Panduan Input Penerimaan Barang</p>
                <p>1) Pilih PO (jika ada) lalu supplier. 2) Isi tanggal terima dan detail pembayaran. 3) Tambah item diterima sesuai qty & satuan aktual saat barang datang.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Purchase Order</label>
                    <SearchableSelect
                        value={data.purchase_order_id}
                        onChange={(value) => setData("purchase_order_id", value)}
                        placeholder="Tanpa PO"
                        searchPlaceholder="Cari nomor PO..."
                        emptyText="PO tidak ditemukan"
                        options={[
                            { value: "", label: "Tanpa PO" },
                            ...purchaseOrderOptions.map((opt) => ({
                                value: String(opt.id),
                                label: opt.kode,
                            })),
                        ]}
                    />
                    {errors.purchase_order_id ? <p className="text-xs text-destructive">{errors.purchase_order_id}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Supplier</label>
                    <SearchableSelect
                        value={data.supplier_id}
                        onChange={(value) => setData("supplier_id", value)}
                        placeholder="Tanpa supplier"
                        searchPlaceholder="Cari supplier..."
                        emptyText="Supplier tidak ditemukan"
                        options={[
                            { value: "", label: "Tanpa supplier" },
                            ...supplierOptions.map((opt) => ({
                                value: String(opt.id),
                                label: opt.nama,
                            })),
                        ]}
                    />
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 rounded-xl relative">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Pembayaran</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status_pembayaran} onChange={(e) => setData("status_pembayaran", e.target.value)}>
                        <option value="unpaid">Belum Bayar (Hutang)</option>
                        <option value="partial">Bayar Sebagian (DP)</option>
                        <option value="paid">Lunas</option>
                    </select>
                </div>

                {data.status_pembayaran !== "unpaid" && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Metode Bayar</label>
                        <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.metode_pembayaran} onChange={(e) => setData("metode_pembayaran", e.target.value)}>
                            <option value="kas">Kas Tunai</option>
                            <option value="bank">Bank / Transfer</option>
                            <option value="petty_cash">Petty Cash</option>
                        </select>
                    </div>
                )}

                {data.status_pembayaran === "partial" && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Nominal DP</label>
                        <Input type="number" min="0" value={data.jumlah_dibayar} onChange={(e) => setData("jumlah_dibayar", Number(e.target.value))} />
                    </div>
                )}

                {data.status_pembayaran !== "paid" && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Jatuh Tempo</label>
                        <Input type="date" value={data.jatuh_tempo} onChange={(e) => setData("jatuh_tempo", e.target.value)} />
                    </div>
                )}
            </div>

            <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Item Penerimaan</p>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>Tambah Item</Button>
                </div>
                <p className="text-xs text-muted-foreground">Isi jumlah sesuai barang yang benar-benar datang. Sistem otomatis konversi ke satuan stok.</p>

                {data.items.map((item, index) => {
                    const bahan = resolveBahan(item.bahan_baku_id);
                    const satuanKecil = bahan?.satuan_kecil || bahan?.satuan;
                    const satuanBesar = bahan?.satuan_besar;
                    const konversi = Number(bahan?.konversi_besar_ke_kecil || 1);

                    return (
                    <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border p-2 md:grid-cols-12">
                        <div className="md:col-span-3">
                            <Input value={item.purchase_order_item_id || ""} onChange={(event) => updateItem(index, "purchase_order_item_id", event.target.value)} placeholder="PO Item ID (opsional)" />
                        </div>
                        <div className="md:col-span-3">
                            <SearchableSelect
                                value={item.bahan_baku_id}
                                onChange={(bahanId) => {
                                    const bahan = resolveBahan(bahanId);
                                    patchItem(index, {
                                        bahan_baku_id: bahanId,
                                        satuan_input: bahan?.default_satuan_beli || bahan?.satuan_kecil || bahan?.satuan || "",
                                    });
                                }}
                                placeholder="Pilih bahan"
                                searchPlaceholder="Cari bahan baku..."
                                emptyText="Bahan baku tidak ditemukan"
                                options={bahanBakuOptions.map((opt) => ({
                                    value: String(opt.id),
                                    label: opt.nama,
                                    keywords: [opt.kode, opt.satuan_kecil || opt.satuan].filter(Boolean).join(" "),
                                }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                type="number"
                                min={0.001}
                                step="0.001"
                                value={item.qty_input}
                                onChange={(event) => {
                                    const value = Number(event.target.value || 0);
                                    patchItem(index, {
                                        qty_input: value,
                                        qty_diterima: value,
                                    });
                                }}
                                placeholder="Qty"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <select
                                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                                value={item.satuan_input || (bahan?.default_satuan_beli || bahan?.satuan_kecil || bahan?.satuan || "")}
                                onChange={(event) => updateItem(index, "satuan_input", event.target.value)}
                                required
                            >
                                <option value="">Satuan</option>
                                {unitOptions(bahan).map((unit) => (
                                    <option key={`${index}-${unit}`} value={unit}>{unit}</option>
                                ))}
                            </select>
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

                        {bahan ? (
                            <div className="md:col-span-12">
                                <p className="text-xs text-muted-foreground">
                                    Konversi bahan ini: 1 {satuanBesar || satuanKecil} = {satuanBesar ? `${konversi} ${satuanKecil}` : `1 ${satuanKecil}`}. Stok akan ditambah dalam {satuanKecil}.
                                </p>
                            </div>
                        ) : null}
                    </div>
                    );
                })}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
