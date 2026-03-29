import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = [
    { value: "hadir", label: "Hadir" },
    { value: "izin", label: "Izin" },
    { value: "sakit", label: "Sakit" },
    { value: "alpha", label: "Alpha" },
    { value: "cuti", label: "Cuti" },
    { value: "terlambat", label: "Terlambat" },
];

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        pegawai_id: initialValues?.pegawai_id ?? "",
        tanggal: initialValues?.tanggal ?? "",
        jam_masuk: initialValues?.jam_masuk ?? "",
        jam_keluar: initialValues?.jam_keluar ?? "",
        status: initialValues?.status ?? "hadir",
        keterangan: initialValues?.keterangan ?? "",
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
                        placeholder="Contoh: ABS-0001"
                    />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pegawai</label>
                    <SearchableSelect
                        value={data.pegawai_id}
                        onChange={(value) => setData("pegawai_id", value)}
                        placeholder="Pilih pegawai"
                        searchPlaceholder="Cari pegawai..."
                        emptyText="Pegawai tidak ditemukan"
                        options={pegawaiOptions.map((pegawai) => ({
                            value: String(pegawai.id),
                            label: pegawai.nama,
                            keywords: [pegawai.no_identitas, pegawai.jabatan].filter(Boolean).join(" "),
                        }))}
                    />
                    {errors.pegawai_id ? <p className="text-xs text-destructive">{errors.pegawai_id}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input
                        type="date"
                        value={data.tanggal}
                        onChange={(event) => setData("tanggal", event.target.value)}
                        required
                    />
                    {errors.tanggal ? <p className="text-xs text-destructive">{errors.tanggal}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jam Masuk</label>
                    <Input
                        type="time"
                        value={data.jam_masuk}
                        onChange={(event) => setData("jam_masuk", event.target.value)}
                    />
                    {errors.jam_masuk ? <p className="text-xs text-destructive">{errors.jam_masuk}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jam Keluar</label>
                    <Input
                        type="time"
                        value={data.jam_keluar}
                        onChange={(event) => setData("jam_keluar", event.target.value)}
                    />
                    {errors.jam_keluar ? <p className="text-xs text-destructive">{errors.jam_keluar}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                        value={data.status}
                        onChange={(event) => setData("status", event.target.value)}
                        required
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    {errors.status ? <p className="text-xs text-destructive">{errors.status}</p> : null}
                </div>
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
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Keterangan</label>
                <Textarea
                    value={data.keterangan}
                    onChange={(event) => setData("keterangan", event.target.value)}
                    rows={3}
                    placeholder="Catatan tambahan absensi"
                />
                {errors.keterangan ? <p className="text-xs text-destructive">{errors.keterangan}</p> : null}
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
