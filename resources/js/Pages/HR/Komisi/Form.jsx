import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "proses", label: "Proses" },
    { value: "dibayar", label: "Dibayar" },
    { value: "dibatalkan", label: "Dibatalkan" },
];

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        pegawai_id: initialValues?.pegawai_id ?? "",
        periode: initialValues?.periode ?? "",
        dasar_perhitungan: initialValues?.dasar_perhitungan ?? 0,
        persentase: initialValues?.persentase ?? 0,
        nominal: initialValues?.nominal ?? 0,
        status: initialValues?.status ?? "draft",
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
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
                        placeholder="Contoh: KOM-0001"
                    />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pegawai</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.pegawai_id}
                        onChange={(event) => setData("pegawai_id", event.target.value)}
                    >
                        <option value="">Pilih pegawai</option>
                        {pegawaiOptions.map((pegawai) => (
                            <option key={pegawai.id} value={pegawai.id}>{pegawai.nama}</option>
                        ))}
                    </select>
                    {errors.pegawai_id ? <p className="text-xs text-destructive">{errors.pegawai_id}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Periode (YYYY-MM)</label>
                    <Input
                        value={data.periode}
                        onChange={(event) => setData("periode", event.target.value)}
                        placeholder="2026-03"
                        required
                    />
                    {errors.periode ? <p className="text-xs text-destructive">{errors.periode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Dasar Perhitungan</label>
                    <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.dasar_perhitungan}
                        onChange={(event) => setData("dasar_perhitungan", Number(event.target.value || 0))}
                    />
                    {errors.dasar_perhitungan ? <p className="text-xs text-destructive">{errors.dasar_perhitungan}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Persentase</label>
                    <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.persentase}
                        onChange={(event) => setData("persentase", Number(event.target.value || 0))}
                    />
                    {errors.persentase ? <p className="text-xs text-destructive">{errors.persentase}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nominal Komisi</label>
                    <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.nominal}
                        onChange={(event) => setData("nominal", Number(event.target.value || 0))}
                    />
                    {errors.nominal ? <p className="text-xs text-destructive">{errors.nominal}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.status}
                        onChange={(event) => setData("status", event.target.value)}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Aktif</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.is_active ? "1" : "0"}
                        onChange={(event) => setData("is_active", event.target.value === "1")}
                    >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Catatan</label>
                    <Textarea
                        value={data.catatan}
                        onChange={(event) => setData("catatan", event.target.value)}
                        rows={2}
                        placeholder="Catatan pembayaran komisi"
                    />
                    {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
                </Button>
            </DialogFooter>
        </form>
    );
}
