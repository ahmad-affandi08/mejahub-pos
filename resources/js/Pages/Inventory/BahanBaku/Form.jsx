import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, supplierOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        supplier_id: initialValues?.supplier_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        satuan_kecil: initialValues?.satuan_kecil ?? initialValues?.satuan ?? "",
        satuan_besar: initialValues?.satuan_besar ?? "",
        konversi_besar_ke_kecil: initialValues?.konversi_besar_ke_kecil ?? 1,
        default_satuan_beli: initialValues?.default_satuan_beli ?? initialValues?.satuan_kecil ?? initialValues?.satuan ?? "",
        harga_beli_terakhir: initialValues?.harga_beli_terakhir ?? 0,
        stok_minimum_input: initialValues?.stok_minimum ?? 0,
        stok_minimum_unit: initialValues?.satuan_kecil ?? initialValues?.satuan ?? "",
        stok_saat_ini_input: initialValues?.stok_saat_ini ?? 0,
        stok_saat_ini_unit: initialValues?.satuan_kecil ?? initialValues?.satuan ?? "",
        keterangan: initialValues?.keterangan ?? "",
        is_active: initialValues?.is_active ?? true,
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

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Panduan Input Bahan Baku</p>
                <p>Tentukan satuan kecil sebagai basis stok (contoh: gram). Jika belanja dalam kemasan besar (contoh: kg), isi satuan besar dan konversinya agar PO/penerimaan otomatis dihitung benar.</p>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: BB-001" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Bahan</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Satuan Kecil (Basis Stok)</label>
                    <Input value={data.satuan_kecil} onChange={(event) => setData("satuan_kecil", event.target.value)} placeholder="gram, ml, pcs" required />
                    {errors.satuan_kecil ? <p className="text-xs text-destructive">{errors.satuan_kecil}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Satuan Besar (Opsional)</label>
                    <Input value={data.satuan_besar} onChange={(event) => setData("satuan_besar", event.target.value)} placeholder="kg, liter, box" />
                    {errors.satuan_besar ? <p className="text-xs text-destructive">{errors.satuan_besar}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Konversi Besar ke Kecil</label>
                    <Input type="number" min={1} step="0.001" value={data.konversi_besar_ke_kecil} onChange={(event) => setData("konversi_besar_ke_kecil", Number(event.target.value || 1))} />
                    <p className="text-xs text-muted-foreground">Contoh: 1 kg = 1000 gram, maka isi 1000.</p>
                    {errors.konversi_besar_ke_kecil ? <p className="text-xs text-destructive">{errors.konversi_besar_ke_kecil}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default Satuan Beli</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.default_satuan_beli}
                        onChange={(event) => setData("default_satuan_beli", event.target.value)}
                    >
                        <option value={data.satuan_kecil || ""}>{data.satuan_kecil || "Satuan Kecil"}</option>
                        {data.satuan_besar ? <option value={data.satuan_besar}>{data.satuan_besar}</option> : null}
                    </select>
                    {errors.default_satuan_beli ? <p className="text-xs text-destructive">{errors.default_satuan_beli}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Harga Beli Terakhir</label>
                    <Input type="number" min={0} step="0.01" value={data.harga_beli_terakhir} onChange={(event) => setData("harga_beli_terakhir", Number(event.target.value || 0))} />
                    {errors.harga_beli_terakhir ? <p className="text-xs text-destructive">{errors.harga_beli_terakhir}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Stok Minimum (Input)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="number" min={0} step="0.001" value={data.stok_minimum_input} onChange={(event) => setData("stok_minimum_input", Number(event.target.value || 0))} />
                        <select
                            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                            value={data.stok_minimum_unit}
                            onChange={(event) => setData("stok_minimum_unit", event.target.value)}
                        >
                            <option value={data.satuan_kecil || ""}>{data.satuan_kecil || "Satuan Kecil"}</option>
                            {data.satuan_besar ? <option value={data.satuan_besar}>{data.satuan_besar}</option> : null}
                        </select>
                    </div>
                    {errors.stok_minimum_input || errors.stok_minimum ? <p className="text-xs text-destructive">{errors.stok_minimum_input || errors.stok_minimum}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Stok Saat Ini (Input)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="number" min={0} step="0.001" value={data.stok_saat_ini_input} onChange={(event) => setData("stok_saat_ini_input", Number(event.target.value || 0))} />
                        <select
                            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                            value={data.stok_saat_ini_unit}
                            onChange={(event) => setData("stok_saat_ini_unit", event.target.value)}
                        >
                            <option value={data.satuan_kecil || ""}>{data.satuan_kecil || "Satuan Kecil"}</option>
                            {data.satuan_besar ? <option value={data.satuan_besar}>{data.satuan_besar}</option> : null}
                        </select>
                    </div>
                    {errors.stok_saat_ini_input || errors.stok_saat_ini ? <p className="text-xs text-destructive">{errors.stok_saat_ini_input || errors.stok_saat_ini}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Keterangan</label>
                    <Input value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} placeholder="Contoh: simpan di rak kering, supplier utama A" />
                    {errors.keterangan ? <p className="text-xs text-destructive">{errors.keterangan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.is_active ? "1" : "0"}
                        onChange={(event) => setData("is_active", event.target.value === "1")}
                    >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                    {errors.is_active ? <p className="text-xs text-destructive">{errors.is_active}</p> : null}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
