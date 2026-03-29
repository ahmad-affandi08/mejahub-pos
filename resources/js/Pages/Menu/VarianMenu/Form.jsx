import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, menuOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        data_menu_id: initialValues?.data_menu_id ?? "",
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        deskripsi: initialValues?.deskripsi ?? "",
        harga_tambahan: initialValues?.harga_tambahan ?? 0,
        urutan: initialValues?.urutan ?? 0,
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
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Menu Induk</label>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Varian</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Harga Tambahan</label>
                    <Input type="number" min={0} step="0.01" value={data.harga_tambahan} onChange={(event) => setData("harga_tambahan", Number(event.target.value || 0))} required />
                    {errors.harga_tambahan ? <p className="text-xs text-destructive">{errors.harga_tambahan}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Urutan</label>
                    <Input type="number" min={0} value={data.urutan} onChange={(event) => setData("urutan", Number(event.target.value || 0))} />
                    {errors.urutan ? <p className="text-xs text-destructive">{errors.urutan}</p> : null}
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
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
