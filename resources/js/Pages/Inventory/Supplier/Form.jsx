import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        kontak_pic: initialValues?.kontak_pic ?? "",
        telepon: initialValues?.telepon ?? "",
        email: initialValues?.email ?? "",
        alamat: initialValues?.alamat ?? "",
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input
                        value={data.kode}
                        onChange={(event) => setData("kode", event.target.value)}
                        placeholder="Contoh: SUP-001"
                    />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Supplier</label>
                    <Input
                        value={data.nama}
                        onChange={(event) => setData("nama", event.target.value)}
                        required
                    />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kontak PIC</label>
                    <Input
                        value={data.kontak_pic}
                        onChange={(event) => setData("kontak_pic", event.target.value)}
                    />
                    {errors.kontak_pic ? <p className="text-xs text-destructive">{errors.kontak_pic}</p> : null}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telepon</label>
                    <Input
                        value={data.telepon}
                        onChange={(event) => setData("telepon", event.target.value)}
                    />
                    {errors.telepon ? <p className="text-xs text-destructive">{errors.telepon}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(event) => setData("email", event.target.value)}
                />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Alamat</label>
                <Input
                    value={data.alamat}
                    onChange={(event) => setData("alamat", event.target.value)}
                />
                {errors.alamat ? <p className="text-xs text-destructive">{errors.alamat}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Keterangan</label>
                    <Input
                        value={data.keterangan}
                        onChange={(event) => setData("keterangan", event.target.value)}
                    />
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
