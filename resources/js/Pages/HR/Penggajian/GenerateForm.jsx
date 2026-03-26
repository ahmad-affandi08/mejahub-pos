import { useForm } from "@inertiajs/react";

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
    const jabatanOptions = Array.from(
        new Set(
            (pegawaiOptions ?? [])
                .map((pegawai) => (pegawai.jabatan ?? "").trim())
                .filter(Boolean)
        )
    ).sort((a, b) => a.localeCompare(b));

    const { data, setData, post, processing, errors } = useForm({
        generate_mode: true,
        pegawai_ids: [],
        periode: "",
        tanggal_pembayaran: "",
        hari_kerja: [1, 2, 3, 4, 5, 6],
        gaji_pokok_default: 0,
        gaji_pokok_per_jabatan: {},
        tunjangan_default: 0,
        lembur_default: 0,
        bonus_default: 0,
        potongan_default: 0,
        potongan_per_alpha: 0,
        include_terlambat_penalty: false,
        potongan_per_terlambat: 0,
        status: "proses",
        kode_prefix: "GJI",
        skip_existing: true,
        is_active: true,
        catatan: "Generate otomatis dari absensi",
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

    const submit = (event) => {
        event.preventDefault();

        post(endpoint, {
            preserveScroll: true,
            onSuccess: () => onSuccess?.(),
        });
    };

    const setGajiJabatan = (jabatan, value) => {
        setData("gaji_pokok_per_jabatan", {
            ...data.gaji_pokok_per_jabatan,
            [jabatan]: Number(value || 0),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                Sistem akan generate payroll berdasarkan rekap absensi per periode (hadir, alpha, izin, sakit, cuti, terlambat).
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Periode (YYYY-MM)</label>
                    <Input value={data.periode} onChange={(event) => setData("periode", event.target.value)} placeholder="2026-03" required />
                    {errors.periode ? <p className="text-xs text-destructive">{errors.periode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal Pembayaran</label>
                    <Input type="date" value={data.tanggal_pembayaran} onChange={(event) => setData("tanggal_pembayaran", event.target.value)} />
                    {errors.tanggal_pembayaran ? <p className="text-xs text-destructive">{errors.tanggal_pembayaran}</p> : null}
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
                <label className="text-sm font-medium">Pilih Pegawai (kosong = semua aktif)</label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {pegawaiOptions.map((pegawai) => (
                        <label key={pegawai.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={data.pegawai_ids.includes(pegawai.id)} onChange={() => togglePegawai(pegawai.id)} />
                            <span>{pegawai.nama} {pegawai.jabatan ? `(${pegawai.jabatan})` : ""}</span>
                        </label>
                    ))}
                </div>
                {errors.pegawai_ids ? <p className="text-xs text-destructive">{errors.pegawai_ids}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Gaji Pokok Default</label>
                    <Input type="number" min={0} step="0.01" value={data.gaji_pokok_default} onChange={(event) => setData("gaji_pokok_default", Number(event.target.value || 0))} required />
                    {errors.gaji_pokok_default ? <p className="text-xs text-destructive">{errors.gaji_pokok_default}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tunjangan Default</label>
                    <Input type="number" min={0} step="0.01" value={data.tunjangan_default} onChange={(event) => setData("tunjangan_default", Number(event.target.value || 0))} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lembur Default</label>
                    <Input type="number" min={0} step="0.01" value={data.lembur_default} onChange={(event) => setData("lembur_default", Number(event.target.value || 0))} />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Gaji Pokok per Jabatan (Opsional)</label>
                <p className="text-xs text-muted-foreground">Isi kalau tiap jabatan punya gaji pokok berbeda. Jika kosong, sistem pakai Gaji Pokok Default.</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {jabatanOptions.map((jabatan) => (
                        <div key={jabatan} className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">{jabatan}</label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.gaji_pokok_per_jabatan?.[jabatan] ?? ""}
                                onChange={(event) => setGajiJabatan(jabatan, event.target.value)}
                                placeholder={`Default: ${data.gaji_pokok_default}`}
                            />
                        </div>
                    ))}
                </div>
                {errors.gaji_pokok_per_jabatan ? <p className="text-xs text-destructive">{errors.gaji_pokok_per_jabatan}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bonus Default</label>
                    <Input type="number" min={0} step="0.01" value={data.bonus_default} onChange={(event) => setData("bonus_default", Number(event.target.value || 0))} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Potongan Default</label>
                    <Input type="number" min={0} step="0.01" value={data.potongan_default} onChange={(event) => setData("potongan_default", Number(event.target.value || 0))} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Potongan per Alpha</label>
                    <Input type="number" min={0} step="0.01" value={data.potongan_per_alpha} onChange={(event) => setData("potongan_per_alpha", Number(event.target.value || 0))} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Penalti Terlambat</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.include_terlambat_penalty ? "1" : "0"} onChange={(event) => setData("include_terlambat_penalty", event.target.value === "1")}>
                        <option value="0">Tidak</option>
                        <option value="1">Ya</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Potongan per Terlambat</label>
                    <Input type="number" min={0} step="0.01" value={data.potongan_per_terlambat} onChange={(event) => setData("potongan_per_terlambat", Number(event.target.value || 0))} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status} onChange={(event) => setData("status", event.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="proses">Proses</option>
                        <option value="dibayar">Dibayar</option>
                        <option value="dibatalkan">Dibatalkan</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prefix Kode</label>
                    <Input value={data.kode_prefix} onChange={(event) => setData("kode_prefix", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Skip Existing</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.skip_existing ? "1" : "0"} onChange={(event) => setData("skip_existing", event.target.value === "1")}>
                        <option value="1">Ya</option>
                        <option value="0">Tidak (replace)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Generate..." : "Generate Payroll Otomatis"}</Button>
            </DialogFooter>
        </form>
    );
}
