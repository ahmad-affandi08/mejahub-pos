import { useEffect, useMemo } from "react";
import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "proses", label: "Proses" },
    { value: "dibayar", label: "Dibayar" },
    { value: "dibatalkan", label: "Dibatalkan" },
];

const numberValue = (value) => Number(value || 0);

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, gajiPokokTemplatePerPegawai, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        pegawai_id: initialValues?.pegawai_id ?? "",
        periode: initialValues?.periode ?? "",
        tanggal_pembayaran: initialValues?.tanggal_pembayaran ?? "",
        gaji_pokok: initialValues?.gaji_pokok ?? 0,
        tunjangan: initialValues?.tunjangan ?? 0,
        lembur: initialValues?.lembur ?? 0,
        bonus: initialValues?.bonus ?? 0,
        potongan: initialValues?.potongan ?? 0,
        status: initialValues?.status ?? "draft",
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    });

    const totalGaji = useMemo(() => {
        return numberValue(data.gaji_pokok)
            + numberValue(data.tunjangan)
            + numberValue(data.lembur)
            + numberValue(data.bonus)
            - numberValue(data.potongan);
    }, [data.bonus, data.gaji_pokok, data.lembur, data.potongan, data.tunjangan]);

    const templateGajiPokok = useMemo(() => {
        const pegawaiId = Number(data.pegawai_id || 0);

        if (pegawaiId <= 0) {
            return null;
        }

        const value = gajiPokokTemplatePerPegawai?.[pegawaiId];

        if (value === undefined || value === null || value === "") {
            return null;
        }

        return numberValue(value);
    }, [data.pegawai_id, gajiPokokTemplatePerPegawai]);

    useEffect(() => {
        if (mode !== "create") {
            return;
        }

        if (templateGajiPokok === null) {
            return;
        }

        setData("gaji_pokok", templateGajiPokok);
    }, [mode, setData, templateGajiPokok]);

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
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: GJI-0001" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pegawai</label>
                    <SearchableSelect
                        value={data.pegawai_id}
                        onChange={(value) => setData("pegawai_id", value === "" ? "" : Number(value))}
                        placeholder="Pilih pegawai"
                        searchPlaceholder="Cari pegawai..."
                        emptyText="Pegawai tidak ditemukan"
                        options={pegawaiOptions.map((pegawai) => ({
                            value: String(pegawai.id),
                            label: `${pegawai.nama}${pegawai.jabatan ? ` (${pegawai.jabatan})` : ""}`,
                            keywords: [pegawai.no_identitas, pegawai.jabatan].filter(Boolean).join(" "),
                        }))}
                    />
                    {errors.pegawai_id ? <p className="text-xs text-destructive">{errors.pegawai_id}</p> : null}
                    {templateGajiPokok !== null ? <p className="text-xs text-muted-foreground">Template gaji pokok aktif: {templateGajiPokok.toFixed(2)}</p> : null}
                </div>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Gaji Pokok</label>
                    <Input type="number" min={0} step="0.01" value={data.gaji_pokok} onChange={(event) => setData("gaji_pokok", numberValue(event.target.value))} required />
                    {errors.gaji_pokok ? <p className="text-xs text-destructive">{errors.gaji_pokok}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tunjangan</label>
                    <Input type="number" min={0} step="0.01" value={data.tunjangan} onChange={(event) => setData("tunjangan", numberValue(event.target.value))} />
                    {errors.tunjangan ? <p className="text-xs text-destructive">{errors.tunjangan}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lembur</label>
                    <Input type="number" min={0} step="0.01" value={data.lembur} onChange={(event) => setData("lembur", numberValue(event.target.value))} />
                    {errors.lembur ? <p className="text-xs text-destructive">{errors.lembur}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bonus</label>
                    <Input type="number" min={0} step="0.01" value={data.bonus} onChange={(event) => setData("bonus", numberValue(event.target.value))} />
                    {errors.bonus ? <p className="text-xs text-destructive">{errors.bonus}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Potongan</label>
                    <Input type="number" min={0} step="0.01" value={data.potongan} onChange={(event) => setData("potongan", numberValue(event.target.value))} />
                    {errors.potongan ? <p className="text-xs text-destructive">{errors.potongan}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Total Gaji (Auto)</label>
                    <Input value={totalGaji.toFixed(2)} readOnly />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.status} onChange={(event) => setData("status", event.target.value)}>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
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
                <Textarea value={data.catatan} onChange={(event) => setData("catatan", event.target.value)} rows={2} placeholder="Catatan penggajian" />
                {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
