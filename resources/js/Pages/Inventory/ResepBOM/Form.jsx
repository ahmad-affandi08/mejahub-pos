import { useForm } from "@inertiajs/react";

import SearchableSelect from "@/components/shared/SearchableSelect";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const createBulkItem = () => ({
    bahan_baku_id: "",
    kode: "",
    qty_kebutuhan: 1,
    satuan: "",
    referensi_porsi: 1,
    catatan: "",
    is_active: true,
});

export default function Form({ mode, endpoint, initialValues, menuOptions, bahanBakuOptions, onSuccess, onCancel }) {
    const isEdit = mode === "edit" && Boolean(initialValues?.id);

    const createState = {
        data_menu_id: initialValues?.data_menu_id ? String(initialValues.data_menu_id) : "",
        items: [createBulkItem()],
    };

    const editState = {
        data_menu_id: initialValues?.data_menu_id ? String(initialValues.data_menu_id) : "",
        bahan_baku_id: initialValues?.bahan_baku_id ? String(initialValues.bahan_baku_id) : "",
        kode: initialValues?.kode ?? "",
        qty_kebutuhan: initialValues?.qty_kebutuhan ?? 0,
        satuan: initialValues?.satuan ?? "",
        referensi_porsi: initialValues?.referensi_porsi ?? 1,
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    };

    const { data, setData, post, transform, processing, errors, reset } = useForm(isEdit ? editState : createState);

    const bahanBakuSelectOptions = bahanBakuOptions.map((opt) => ({
        value: String(opt.id),
        label: opt.nama,
        keywords: [opt.kode, opt.satuan_kecil || opt.satuan].filter(Boolean).join(" "),
    }));

    const addBulkRow = () => {
        if (isEdit) return;
        setData("items", [...(data.items ?? []), createBulkItem()]);
    };

    const removeBulkRow = (index) => {
        if (isEdit) return;
        const nextItems = (data.items ?? []).filter((_, idx) => idx !== index);
        setData("items", nextItems.length > 0 ? nextItems : [createBulkItem()]);
    };

    const updateBulkRow = (index, key, value) => {
        if (isEdit) return;

        const nextItems = [...(data.items ?? [])];
        const current = nextItems[index] ?? createBulkItem();
        nextItems[index] = { ...current, [key]: value };

        if (key === "bahan_baku_id") {
            const selected = bahanBakuOptions.find((opt) => String(opt.id) === String(value));
            nextItems[index].satuan = selected?.satuan || "";
        }

        setData("items", nextItems);
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        };

        if (isEdit && initialValues?.id) {
            transform((payload) => ({ ...payload, _method: "put" }));
            post(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        transform((payload) => ({
            data_menu_id: payload.data_menu_id,
            items: (payload.items ?? []).map((item) => ({
                bahan_baku_id: item.bahan_baku_id,
                kode: item.kode || "",
                qty_kebutuhan: Number(item.qty_kebutuhan || 0),
                satuan: item.satuan || "",
                referensi_porsi: Number(item.referensi_porsi || 1),
                catatan: item.catatan || "",
                is_active: item.is_active ?? true,
            })),
        }));
        post(`${endpoint}/bulk`, options);
    };

    if (isEdit) {
        return (
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Menu</label>
                        <SearchableSelect
                            value={data.data_menu_id}
                            onChange={(value) => setData("data_menu_id", value)}
                            placeholder="Pilih menu"
                            searchPlaceholder="Cari menu..."
                            emptyText="Menu tidak ditemukan"
                            options={menuOptions.map((opt) => ({
                                value: String(opt.id),
                                label: opt.nama,
                                keywords: opt.kode || "",
                            }))}
                        />
                        {errors.data_menu_id ? <p className="text-xs text-destructive">{errors.data_menu_id}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Bahan Baku</label>
                        <SearchableSelect
                            value={data.bahan_baku_id}
                            onChange={(value) => {
                                setData("bahan_baku_id", value);
                                const selected = bahanBakuOptions.find((opt) => String(opt.id) === String(value));
                                setData("satuan", selected?.satuan || "");
                            }}
                            placeholder="Pilih bahan baku"
                            searchPlaceholder="Cari bahan baku..."
                            emptyText="Bahan baku tidak ditemukan"
                            options={bahanBakuSelectOptions}
                        />
                        {errors.bahan_baku_id ? <p className="text-xs text-destructive">{errors.bahan_baku_id}</p> : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Kode (Opsional)</label>
                        <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Auto-generate jika kosong" />
                        {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Qty Kebutuhan</label>
                        <Input type="number" min={0.001} step="0.001" value={data.qty_kebutuhan} onChange={(event) => setData("qty_kebutuhan", Number(event.target.value || 0))} required />
                        {errors.qty_kebutuhan ? <p className="text-xs text-destructive">{errors.qty_kebutuhan}</p> : null}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Satuan</label>
                        <Input value={data.satuan} onChange={(event) => setData("satuan", event.target.value)} placeholder="gram, ml, pcs" />
                        {errors.satuan ? <p className="text-xs text-destructive">{errors.satuan}</p> : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Referensi Porsi</label>
                        <Input type="number" min={0.001} step="0.001" value={data.referensi_porsi} onChange={(event) => setData("referensi_porsi", Number(event.target.value || 1))} />
                        {errors.referensi_porsi ? <p className="text-xs text-destructive">{errors.referensi_porsi}</p> : null}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Status</label>
                        <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Catatan</label>
                    <Input value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                    <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan Perubahan"}</Button>
                </DialogFooter>
            </form>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Menu</label>
                <SearchableSelect
                    value={data.data_menu_id}
                    onChange={(value) => setData("data_menu_id", value)}
                    placeholder="Pilih menu"
                    searchPlaceholder="Cari menu..."
                    emptyText="Menu tidak ditemukan"
                    options={menuOptions.map((opt) => ({
                        value: String(opt.id),
                        label: opt.nama,
                        keywords: opt.kode || "",
                    }))}
                />
                {errors.data_menu_id ? <p className="text-xs text-destructive">{errors.data_menu_id}</p> : null}
            </div>

            <div className="w-full overflow-x-auto rounded-xl border">
                <table className="w-full table-fixed text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                            <th className="w-[34%] px-2 py-2 font-medium">Bahan Baku</th>
                            <th className="w-[16%] px-2 py-2 font-medium">Qty</th>
                            <th className="w-[20%] px-2 py-2 font-medium">Satuan</th>
                            <th className="w-[20%] px-2 py-2 font-medium">Kode</th>
                            <th className="w-[10%] px-2 py-2 text-right font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.items ?? []).map((item, index) => (
                            <tr key={`item-${index}`} className="border-t align-top">
                                <td className="px-2 py-2">
                                    <SearchableSelect
                                        value={item.bahan_baku_id}
                                        onChange={(value) => updateBulkRow(index, "bahan_baku_id", value)}
                                        placeholder="Pilih bahan baku"
                                        searchPlaceholder="Cari bahan baku..."
                                        emptyText="Bahan baku tidak ditemukan"
                                        options={bahanBakuSelectOptions}
                                    />
                                    {errors[`items.${index}.bahan_baku_id`] ? <p className="mt-1 text-xs text-destructive">{errors[`items.${index}.bahan_baku_id`]}</p> : null}
                                </td>
                                <td className="px-2 py-2">
                                    <Input
                                        type="number"
                                        min={0.001}
                                        step="0.001"
                                        value={item.qty_kebutuhan}
                                        onChange={(event) => updateBulkRow(index, "qty_kebutuhan", Number(event.target.value || 0))}
                                        required
                                    />
                                    {errors[`items.${index}.qty_kebutuhan`] ? <p className="mt-1 text-xs text-destructive">{errors[`items.${index}.qty_kebutuhan`]}</p> : null}
                                </td>
                                <td className="px-2 py-2">
                                    <Input
                                        value={item.satuan}
                                        onChange={(event) => updateBulkRow(index, "satuan", event.target.value)}
                                        placeholder="gram, ml, pcs"
                                    />
                                    {errors[`items.${index}.satuan`] ? <p className="mt-1 text-xs text-destructive">{errors[`items.${index}.satuan`]}</p> : null}
                                </td>
                                <td className="px-2 py-2">
                                    <Input
                                        value={item.kode}
                                        onChange={(event) => updateBulkRow(index, "kode", event.target.value)}
                                        placeholder="Auto jika kosong"
                                    />
                                    {errors[`items.${index}.kode`] ? <p className="mt-1 text-xs text-destructive">{errors[`items.${index}.kode`]}</p> : null}
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <Button type="button" variant="outline" size="sm" className="h-9 px-2" onClick={() => removeBulkRow(index)}>Hapus</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {errors.items ? <p className="text-xs text-destructive">{errors.items}</p> : null}

            <div>
                <Button type="button" variant="outline" onClick={addBulkRow}>Tambah Baris</Button>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan Semua"}</Button>
            </DialogFooter>
        </form>
    );
}
