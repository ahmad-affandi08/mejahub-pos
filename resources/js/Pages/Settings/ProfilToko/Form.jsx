import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_toko: initialValues?.kode_toko ?? "",
        nama_toko: initialValues?.nama_toko ?? "",
        nama_brand: initialValues?.nama_brand ?? "",
        email: initialValues?.email ?? "",
        telepon: initialValues?.telepon ?? "",
        alamat: initialValues?.alamat ?? "",
        kota: initialValues?.kota ?? "",
        provinsi: initialValues?.provinsi ?? "",
        kode_pos: initialValues?.kode_pos ?? "",
        npwp: initialValues?.npwp ?? "",
        logo_path: initialValues?.logo_path ?? "",
        timezone: initialValues?.timezone ?? "Asia/Jakarta",
        mata_uang: initialValues?.mata_uang ?? "IDR",
        bahasa: initialValues?.bahasa ?? "id",
        is_default: initialValues?.is_default ?? false,
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
            put(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        post(endpoint, options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode Toko</label>
                    <Input value={data.kode_toko} onChange={(event) => setData("kode_toko", event.target.value)} />
                    {errors.kode_toko ? <p className="text-xs text-destructive">{errors.kode_toko}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Toko</label>
                    <Input value={data.nama_toko} onChange={(event) => setData("nama_toko", event.target.value)} required />
                    {errors.nama_toko ? <p className="text-xs text-destructive">{errors.nama_toko}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Brand</label>
                    <Input value={data.nama_brand} onChange={(event) => setData("nama_brand", event.target.value)} />
                    {errors.nama_brand ? <p className="text-xs text-destructive">{errors.nama_brand}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" value={data.email} onChange={(event) => setData("email", event.target.value)} />
                    {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telepon</label>
                    <Input value={data.telepon} onChange={(event) => setData("telepon", event.target.value)} />
                    {errors.telepon ? <p className="text-xs text-destructive">{errors.telepon}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">NPWP</label>
                    <Input value={data.npwp} onChange={(event) => setData("npwp", event.target.value)} />
                    {errors.npwp ? <p className="text-xs text-destructive">{errors.npwp}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Alamat</label>
                <Textarea value={data.alamat} onChange={(event) => setData("alamat", event.target.value)} rows={2} />
                {errors.alamat ? <p className="text-xs text-destructive">{errors.alamat}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kota</label>
                    <Input value={data.kota} onChange={(event) => setData("kota", event.target.value)} />
                    {errors.kota ? <p className="text-xs text-destructive">{errors.kota}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Provinsi</label>
                    <Input value={data.provinsi} onChange={(event) => setData("provinsi", event.target.value)} />
                    {errors.provinsi ? <p className="text-xs text-destructive">{errors.provinsi}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode Pos</label>
                    <Input value={data.kode_pos} onChange={(event) => setData("kode_pos", event.target.value)} />
                    {errors.kode_pos ? <p className="text-xs text-destructive">{errors.kode_pos}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Timezone</label>
                    <Input value={data.timezone} onChange={(event) => setData("timezone", event.target.value)} />
                    {errors.timezone ? <p className="text-xs text-destructive">{errors.timezone}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mata Uang</label>
                    <Input value={data.mata_uang} onChange={(event) => setData("mata_uang", event.target.value)} />
                    {errors.mata_uang ? <p className="text-xs text-destructive">{errors.mata_uang}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bahasa</label>
                    <Input value={data.bahasa} onChange={(event) => setData("bahasa", event.target.value)} />
                    {errors.bahasa ? <p className="text-xs text-destructive">{errors.bahasa}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Logo Path</label>
                    <Input value={data.logo_path} onChange={(event) => setData("logo_path", event.target.value)} />
                    {errors.logo_path ? <p className="text-xs text-destructive">{errors.logo_path}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_default ? "1" : "0"} onChange={(event) => setData("is_default", event.target.value === "1")}>
                        <option value="0">Tidak</option>
                        <option value="1">Ya</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
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
