import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function newItemRow() {
    return { data_menu_id: "", qty: 1 };
}

export default function Form({ mode, endpoint, initialValues, kategoriOptions, menuOptions, onSuccess, onCancel }) {
    const seedRows = (initialValues?.item_rows ?? []).map((row) => ({
        data_menu_id: String(row.data_menu_id ?? ""),
        qty: row.qty ?? 1,
    }));

    const { data, setData, post, transform, processing, errors, reset } = useForm({
        kategori_menu_id: initialValues?.kategori_menu_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        harga_paket: initialValues?.harga_paket ?? 0,
        is_active: initialValues?.is_active ?? true,
        item_rows: seedRows.length ? seedRows : [newItemRow()],
    });

    const updateRow = (index, key, value) => {
        setData("item_rows", data.item_rows.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
    };

    const addRow = () => {
        setData("item_rows", [...data.item_rows, newItemRow()]);
    };

    const removeRow = (index) => {
        setData("item_rows", data.item_rows.filter((_, idx) => idx !== index));
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

        if (mode === "edit" && initialValues?.id) {
            transform((payload) => ({ ...payload, _method: "put" }));
            post(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        transform((payload) => payload);
        post(endpoint, options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kategori Paket</label>
                    <SearchableSelect
                        value={data.kategori_menu_id}
                        onChange={(value) => setData("kategori_menu_id", value)}
                        placeholder="Tanpa kategori"
                        searchPlaceholder="Cari kategori..."
                        emptyText="Kategori tidak ditemukan"
                        options={[
                            { value: "", label: "Tanpa kategori" },
                            ...kategoriOptions.map((opt) => ({
                                value: String(opt.id),
                                label: opt.nama,
                                keywords: opt.kode || "",
                            })),
                        ]}
                    />
                    {errors.kategori_menu_id ? <p className="text-xs text-destructive">{errors.kategori_menu_id}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1") }>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Paket</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Harga Paket</label>
                <Input type="number" min={0} step="0.01" value={data.harga_paket} onChange={(event) => setData("harga_paket", Number(event.target.value || 0))} required />
                {errors.harga_paket ? <p className="text-xs text-destructive">{errors.harga_paket}</p> : null}
            </div>

            <div className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Item Paket</p>
                    <Button type="button" variant="outline" size="sm" onClick={addRow}>Tambah Item</Button>
                </div>

                <div className="space-y-2">
                    {data.item_rows.map((row, index) => (
                        <div key={`row-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_auto]">
                            <SearchableSelect
                                value={row.data_menu_id}
                                onChange={(value) => updateRow(index, "data_menu_id", value)}
                                placeholder="Pilih menu"
                                searchPlaceholder="Cari menu..."
                                emptyText="Menu tidak ditemukan"
                                options={menuOptions.map((opt) => ({
                                    value: String(opt.id),
                                    label: opt.nama,
                                    keywords: opt.kode || "",
                                }))}
                            />

                            <Input type="number" min={0.01} step="0.01" value={row.qty} onChange={(event) => updateRow(index, "qty", Number(event.target.value || 1))} />

                            <Button type="button" variant="destructive" size="sm" onClick={() => removeRow(index)} disabled={data.item_rows.length <= 1}>Hapus</Button>
                        </div>
                    ))}
                </div>
                {errors["item_rows.0.data_menu_id"] ? <p className="text-xs text-destructive">Item paket wajib diisi.</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
