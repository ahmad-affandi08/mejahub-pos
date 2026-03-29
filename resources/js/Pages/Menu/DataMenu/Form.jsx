import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, kategoriOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        kategori_menu_id: initialValues?.kategori_menu_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        harga: initialValues?.harga ?? 0,
        gambar: null,
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            forceFormData: true,
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
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Kategori</label>
                <SearchableSelect
                    value={data.kategori_menu_id}
                    onChange={(value) => setData("kategori_menu_id", value)}
                    placeholder="Pilih kategori"
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan"
                    options={kategoriOptions.map((opt) => ({
                        value: String(opt.id),
                        label: opt.nama,
                        keywords: opt.kode || "",
                    }))}
                />
                {errors.kategori_menu_id ? <p className="text-xs text-destructive">{errors.kategori_menu_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: MNU-001" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Menu</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} />
                {errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Harga</label>
                    <Input type="number" min={0} step="0.01" value={data.harga} onChange={(event) => setData("harga", Number(event.target.value || 0))} required />
                    {errors.harga ? <p className="text-xs text-destructive">{errors.harga}</p> : null}
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

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Upload Gambar (Maks 2MB)</label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setData("gambar", event.target.files?.[0] ?? null)}
                />
                {initialValues?.gambar ? (
                    <p className="text-xs text-muted-foreground">File saat ini: {initialValues.gambar}</p>
                ) : null}
                {errors.gambar ? <p className="text-xs text-destructive">{errors.gambar}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
