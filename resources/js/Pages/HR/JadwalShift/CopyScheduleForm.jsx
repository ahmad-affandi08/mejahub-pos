import { useForm } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CopyScheduleForm({ endpoint, pegawaiOptions, onSuccess, onCancel }) {
    const [showPegawaiList, setShowPegawaiList] = useState(false);
    const [saving, setSaving] = useState(false);

    const { data, setData, errors, setError, clearErrors } = useForm({
        tanggal_mulai_sumber: "",
        tanggal_selesai_sumber: "",
        tanggal_mulai_tujuan: "",
        pegawai_ids: [],
    });

    const togglePegawai = (pegawaiId) => {
        const current = data.pegawai_ids;
        if (current.includes(pegawaiId)) {
            setData("pegawai_ids", current.filter((id) => id !== pegawaiId));
            return;
        }

        setData("pegawai_ids", [...current, pegawaiId]);
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        clearErrors();

        try {
            const response = await axios.post(endpoint, {
                ...data,
                is_copy: true,
            });

            if (response.data && response.data.drafts) {
                if (response.data.drafts.length === 0) {
                    alert("Tidak ada jadwal yang bisa disalin pada rentang tanggal sumber yang dipilih.");
                    setSaving(false);
                    return;
                }
                onSuccess?.(response.data.drafts);
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const validationErrors = error.response.data.errors;
                for (const field in validationErrors) {
                    setError(field, validationErrors[field][0]);
                }
            } else {
                console.error("Gagal menyalin jadwal", error);
                alert("Terjadi kesalahan sistem saat mengambil data salinan.");
            }
            setSaving(false);
        }
    };

    const selectAllPegawai = () => {
        setData("pegawai_ids", pegawaiOptions.map((item) => item.id));
    };

    const clearPegawai = () => {
        setData("pegawai_ids", []);
    };

    return (
        <form onSubmit={submit} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                Fitur ini akan menarik jadwal Shift yang sudah ada pada minggu/periode sebelumnya, lalu direplika ke tanggal tujuan baru.
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Dari Tanggal (Sumber)</label>
                    <Input type="date" value={data.tanggal_mulai_sumber} onChange={(event) => setData("tanggal_mulai_sumber", event.target.value)} required />
                    {errors.tanggal_mulai_sumber ? <p className="text-xs text-destructive">{errors.tanggal_mulai_sumber}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Sampai Tanggal (Sumber)</label>
                    <Input type="date" value={data.tanggal_selesai_sumber} onChange={(event) => setData("tanggal_selesai_sumber", event.target.value)} required />
                    {errors.tanggal_selesai_sumber ? <p className="text-xs text-destructive">{errors.tanggal_selesai_sumber}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Disalin ke Tanggal Mulai (Tujuan)</label>
                <Input type="date" value={data.tanggal_mulai_tujuan} onChange={(event) => setData("tanggal_mulai_tujuan", event.target.value)} required />
                <p className="text-xs text-muted-foreground">Otomatis menghitung durasi rentang tanggal yang ditarik dari sumber.</p>
                {errors.tanggal_mulai_tujuan ? <p className="text-xs text-destructive">{errors.tanggal_mulai_tujuan}</p> : null}
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Batas Pegawai (Opsional)</label>
                    <button
                        type="button"
                        className="text-xs font-medium text-cyan-700 hover:underline"
                        onClick={() => setShowPegawaiList((value) => !value)}
                    >
                        {showPegawaiList ? "Sembunyikan List" : "Tampilkan List"}
                    </button>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                    <span>
                        {data.pegawai_ids.length === 0 ? "Menyalin semua pegawai" : `Terpilih ${data.pegawai_ids.length} pegawai`}
                    </span>
                    <div className="flex items-center gap-3">
                        <button type="button" className="font-medium text-cyan-700 hover:underline" onClick={selectAllPegawai}>Pilih semua</button>
                        <button type="button" className="font-medium text-slate-600 hover:underline" onClick={clearPegawai}>Kosongkan</button>
                    </div>
                </div>
                {showPegawaiList ? (
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border p-2">
                        {pegawaiOptions.map((pegawai) => (
                            <label key={pegawai.id} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={data.pegawai_ids.includes(pegawai.id)} onChange={() => togglePegawai(pegawai.id)} />
                                <span>{pegawai.nama} {pegawai.jabatan ? `(${pegawai.jabatan})` : ""}</span>
                            </label>
                        ))}
                    </div>
                ) : null}
                {errors.pegawai_ids ? <p className="text-xs text-destructive">{errors.pegawai_ids}</p> : null}
            </div>

            <DialogFooter className="sticky bottom-0 border-t bg-white pt-3">
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={saving}>{saving ? "Membaca Data..." : "Tinjau Hasil Salinan"}</Button>
            </DialogFooter>
        </form>
    );
}
