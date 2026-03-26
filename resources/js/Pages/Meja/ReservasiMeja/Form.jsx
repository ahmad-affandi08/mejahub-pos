import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function toDatetimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Form({ mode, endpoint, initialValues, mejaOptions, statusOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        data_meja_id: initialValues?.data_meja_id ?? "",
        kode: initialValues?.kode ?? "",
        nama_pelanggan: initialValues?.nama_pelanggan ?? "",
        no_hp: initialValues?.no_hp ?? "",
        waktu_reservasi: toDatetimeLocal(initialValues?.waktu_reservasi),
        jumlah_tamu: initialValues?.jumlah_tamu ?? 1,
        status: initialValues?.status ?? "pending",
        catatan: initialValues?.catatan ?? "",
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
                <label className="text-sm font-medium">Meja</label>
                <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.data_meja_id} onChange={(event) => setData("data_meja_id", event.target.value)} required>
                    <option value="">Pilih meja</option>
                    {mejaOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.nama}</option>
                    ))}
                </select>
                {errors.data_meja_id ? <p className="text-xs text-destructive">{errors.data_meja_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode Reservasi</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: RSV-001" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Pelanggan</label>
                    <Input value={data.nama_pelanggan} onChange={(event) => setData("nama_pelanggan", event.target.value)} required />
                    {errors.nama_pelanggan ? <p className="text-xs text-destructive">{errors.nama_pelanggan}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">No HP</label>
                    <Input value={data.no_hp} onChange={(event) => setData("no_hp", event.target.value)} />
                    {errors.no_hp ? <p className="text-xs text-destructive">{errors.no_hp}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Waktu Reservasi</label>
                    <Input type="datetime-local" value={data.waktu_reservasi} onChange={(event) => setData("waktu_reservasi", event.target.value)} required />
                    {errors.waktu_reservasi ? <p className="text-xs text-destructive">{errors.waktu_reservasi}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jumlah Tamu</label>
                    <Input type="number" min={1} value={data.jumlah_tamu} onChange={(event) => setData("jumlah_tamu", Number(event.target.value || 1))} required />
                    {errors.jumlah_tamu ? <p className="text-xs text-destructive">{errors.jumlah_tamu}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status} onChange={(event) => setData("status", event.target.value)}>
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} placeholder="Permintaan khusus pelanggan" />
                {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
