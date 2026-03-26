import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "libur", label: "Libur" },
];

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, shiftOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        pegawai_id: initialValues?.pegawai_id ?? "",
        shift_id: initialValues?.shift_id ?? "",
        tanggal: initialValues?.tanggal ?? "",
        status: initialValues?.status ?? "published",
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onSuccess?.(),
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
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Opsional" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input type="date" value={data.tanggal} onChange={(event) => setData("tanggal", event.target.value)} required />
                    {errors.tanggal ? <p className="text-xs text-destructive">{errors.tanggal}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pegawai</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.pegawai_id} onChange={(event) => setData("pegawai_id", event.target.value)} required>
                        <option value="">Pilih pegawai</option>
                        {pegawaiOptions.map((item) => (
                            <option key={item.id} value={item.id}>{item.nama}</option>
                        ))}
                    </select>
                    {errors.pegawai_id ? <p className="text-xs text-destructive">{errors.pegawai_id}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Shift</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.shift_id} onChange={(event) => setData("shift_id", event.target.value)} required>
                        <option value="">Pilih shift</option>
                        {shiftOptions.map((item) => (
                            <option key={item.id} value={item.id}>{item.nama} ({item.jam_masuk} - {item.jam_keluar})</option>
                        ))}
                    </select>
                    {errors.shift_id ? <p className="text-xs text-destructive">{errors.shift_id}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status} onChange={(event) => setData("status", event.target.value)}>
                        {statusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Aktif</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={3} />
                {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
