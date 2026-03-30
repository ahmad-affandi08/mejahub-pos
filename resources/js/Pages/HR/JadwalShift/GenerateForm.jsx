import { useForm } from "@inertiajs/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const dayOptions = [
    { value: 1, label: "Senin" },
    { value: 2, label: "Selasa" },
    { value: 3, label: "Rabu" },
    { value: 4, label: "Kamis" },
    { value: 5, label: "Jumat" },
    { value: 6, label: "Sabtu" },
    { value: 7, label: "Minggu" },
];

export default function GenerateForm({ endpoint, pegawaiOptions, onSuccess, onCancel }) {
    const [showPegawaiList, setShowPegawaiList] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        generate_mode: true,
        pegawai_ids: [],
        tanggal_mulai: "",
        tanggal_selesai: "",
        hari_kerja: [1, 2, 3, 4, 5],
        status: "published",
        kode_prefix: "JDL",
        catatan: "",
        skip_existing: true,
        use_formula: true,
        generate_libur: true,
    });

    const togglePegawai = (pegawaiId) => {
        const current = data.pegawai_ids;
        if (current.includes(pegawaiId)) {
            setData("pegawai_ids", current.filter((id) => id !== pegawaiId));
            return;
        }

        setData("pegawai_ids", [...current, pegawaiId]);
    };

    const toggleDay = (day) => {
        const current = data.hari_kerja;
        if (current.includes(day)) {
            setData("hari_kerja", current.filter((id) => id !== day));
            return;
        }

        setData("hari_kerja", [...current, day]);
    };

    const submit = async (event) => {
        event.preventDefault();

        try {
            const response = await window.axios.post(endpoint, {
                ...data,
                is_draft: true,
            });

            if (response.data && response.data.drafts) {
                onSuccess?.(response.data.drafts);
            }
        } catch (error) {
            console.error("Gagal generate draft", error);
            // Handle error response or display validation message if setup using Inertia hooks
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
                Formula akan mengatur Waiters, Kitchen, dan Barista mendapatkan sekitar 4 kali libur per 30 hari kerja, dengan pola sebelum dan sesudah libur sesuai aturan operasional.
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Mulai</label>
                    <Input type="date" value={data.tanggal_mulai} onChange={(event) => setData("tanggal_mulai", event.target.value)} required />
                    {errors.tanggal_mulai ? <p className="text-xs text-destructive">{errors.tanggal_mulai}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Selesai</label>
                    <Input type="date" value={data.tanggal_selesai} onChange={(event) => setData("tanggal_selesai", event.target.value)} required />
                    {errors.tanggal_selesai ? <p className="text-xs text-destructive">{errors.tanggal_selesai}</p> : null}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Hari Kerja</label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {dayOptions.map((day) => (
                        <label key={day.value} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                            <input type="checkbox" checked={data.hari_kerja.includes(day.value)} onChange={() => toggleDay(day.value)} />
                            <span>{day.label}</span>
                        </label>
                    ))}
                </div>
                {errors.hari_kerja ? <p className="text-xs text-destructive">{errors.hari_kerja}</p> : null}
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Pilih Pegawai</label>
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
                        Terpilih {data.pegawai_ids.length} dari {pegawaiOptions.length} pegawai
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prefix Kode</label>
                    <Input value={data.kode_prefix} onChange={(event) => setData("kode_prefix", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Skip Jadwal Existing</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.skip_existing ? "1" : "0"} onChange={(event) => setData("skip_existing", event.target.value === "1")}>
                        <option value="1">Ya</option>
                        <option value="0">Tidak (replace)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mode Generate</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.use_formula ? "1" : "0"} onChange={(event) => setData("use_formula", event.target.value === "1")}>
                        <option value="1">Formula Operasional (P1/M1/S1)</option>
                        <option value="0">Rotasi Biasa</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Generate Libur Otomatis</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.generate_libur ? "1" : "0"} onChange={(event) => setData("generate_libur", event.target.value === "1")}>
                        <option value="1">Ya</option>
                        <option value="0">Tidak</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} />
            </div>

            <DialogFooter className="sticky bottom-0 border-t bg-white pt-3">
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit">Preview Draft Jadwal</Button>
            </DialogFooter>
        </form>
    );
}
