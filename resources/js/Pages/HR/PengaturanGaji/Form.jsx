import { useState } from "react";

import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, onSuccess, onCancel }) {
    const [showPolicy, setShowPolicy] = useState(mode === "edit");

    const { data, setData, post, transform, processing, errors } = useForm({
        pegawai_id: initialValues?.pegawai_id ?? "",
        gaji_pokok: initialValues?.gaji_pokok ?? 0,
        kebijakan_penggajian: {
            aktifkan_kebijakan: initialValues?.kebijakan_penggajian?.aktifkan_kebijakan ?? true,
            lembur_per_jam: initialValues?.kebijakan_penggajian?.lembur_per_jam ?? 0,
            lembur_min_menit: initialValues?.kebijakan_penggajian?.lembur_min_menit ?? 60,
            potong_izin: initialValues?.kebijakan_penggajian?.potong_izin ?? false,
            potongan_per_izin: initialValues?.kebijakan_penggajian?.potongan_per_izin ?? 0,
            potong_sakit: initialValues?.kebijakan_penggajian?.potong_sakit ?? false,
            potongan_per_sakit: initialValues?.kebijakan_penggajian?.potongan_per_sakit ?? 0,
            potong_alpha: initialValues?.kebijakan_penggajian?.potong_alpha ?? true,
            potongan_per_alpha: initialValues?.kebijakan_penggajian?.potongan_per_alpha ?? 0,
            potong_terlambat: initialValues?.kebijakan_penggajian?.potong_terlambat ?? false,
            potongan_per_terlambat: initialValues?.kebijakan_penggajian?.potongan_per_terlambat ?? 0,
        },
        catatan: initialValues?.catatan ?? "",
        is_active: initialValues?.is_active ?? true,
    });

    const setPolicy = (key, value) => {
        setData("kebijakan_penggajian", {
            ...data.kebijakan_penggajian,
            [key]: value,
        });
    };

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
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Pegawai</label>
                <select
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                    value={data.pegawai_id}
                    onChange={(event) => setData("pegawai_id", Number(event.target.value || 0))}
                    required
                >
                    <option value="" disabled>Pilih pegawai</option>
                    {pegawaiOptions.map((pegawai) => (
                        <option key={pegawai.id} value={pegawai.id}>
                            {pegawai.nama}{pegawai.jabatan ? ` (${pegawai.jabatan})` : ""}
                        </option>
                    ))}
                </select>
                {errors.pegawai_id ? <p className="text-xs text-destructive">{errors.pegawai_id}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Gaji Pokok Template</label>
                    <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.gaji_pokok}
                        onChange={(event) => setData("gaji_pokok", Number(event.target.value || 0))}
                        required
                    />
                    {errors.gaji_pokok ? <p className="text-xs text-destructive">{errors.gaji_pokok}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Template</label>
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

            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-cyan-900">Kebijakan Payroll Fleksibel</p>
                        <p className="mt-1 text-xs text-cyan-800">Atur tunjangan lembur dan potongan status absensi untuk pegawai ini.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setShowPolicy((prev) => !prev)}>
                        {showPolicy ? "Sembunyikan" : "Tampilkan"}
                    </Button>
                </div>

                {showPolicy ? (
                    <>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Aktifkan Kebijakan</label>
                                <select
                                    className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
                                    value={data.kebijakan_penggajian.aktifkan_kebijakan ? "1" : "0"}
                                    onChange={(event) => setPolicy("aktifkan_kebijakan", event.target.value === "1")}
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Tunjangan Lembur per Jam</label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.kebijakan_penggajian.lembur_per_jam}
                                    onChange={(event) => setPolicy("lembur_per_jam", Number(event.target.value || 0))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Minimal Menit Lembur</label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={data.kebijakan_penggajian.lembur_min_menit}
                                    onChange={(event) => setPolicy("lembur_min_menit", Number(event.target.value || 0))}
                                />
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-lg border bg-white p-2.5">
                                <p className="text-xs font-semibold">Izin</p>
                                <div className="mt-2 grid grid-cols-[110px_1fr] items-center gap-2">
                                    <select
                                        className="h-9 rounded-lg border border-input bg-white px-2 text-sm"
                                        value={data.kebijakan_penggajian.potong_izin ? "1" : "0"}
                                        onChange={(event) => setPolicy("potong_izin", event.target.value === "1")}
                                    >
                                        <option value="0">Tidak Potong</option>
                                        <option value="1">Potong</option>
                                    </select>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.kebijakan_penggajian.potongan_per_izin}
                                        onChange={(event) => setPolicy("potongan_per_izin", Number(event.target.value || 0))}
                                        placeholder="Nominal per hari"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white p-2.5">
                                <p className="text-xs font-semibold">Sakit</p>
                                <div className="mt-2 grid grid-cols-[110px_1fr] items-center gap-2">
                                    <select
                                        className="h-9 rounded-lg border border-input bg-white px-2 text-sm"
                                        value={data.kebijakan_penggajian.potong_sakit ? "1" : "0"}
                                        onChange={(event) => setPolicy("potong_sakit", event.target.value === "1")}
                                    >
                                        <option value="0">Tidak Potong</option>
                                        <option value="1">Potong</option>
                                    </select>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.kebijakan_penggajian.potongan_per_sakit}
                                        onChange={(event) => setPolicy("potongan_per_sakit", Number(event.target.value || 0))}
                                        placeholder="Nominal per hari"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white p-2.5">
                                <p className="text-xs font-semibold">Alpha</p>
                                <div className="mt-2 grid grid-cols-[110px_1fr] items-center gap-2">
                                    <select
                                        className="h-9 rounded-lg border border-input bg-white px-2 text-sm"
                                        value={data.kebijakan_penggajian.potong_alpha ? "1" : "0"}
                                        onChange={(event) => setPolicy("potong_alpha", event.target.value === "1")}
                                    >
                                        <option value="0">Tidak Potong</option>
                                        <option value="1">Potong</option>
                                    </select>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.kebijakan_penggajian.potongan_per_alpha}
                                        onChange={(event) => setPolicy("potongan_per_alpha", Number(event.target.value || 0))}
                                        placeholder="Nominal per hari"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white p-2.5">
                                <p className="text-xs font-semibold">Terlambat</p>
                                <div className="mt-2 grid grid-cols-[110px_1fr] items-center gap-2">
                                    <select
                                        className="h-9 rounded-lg border border-input bg-white px-2 text-sm"
                                        value={data.kebijakan_penggajian.potong_terlambat ? "1" : "0"}
                                        onChange={(event) => setPolicy("potong_terlambat", event.target.value === "1")}
                                    >
                                        <option value="0">Tidak Potong</option>
                                        <option value="1">Potong</option>
                                    </select>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.kebijakan_penggajian.potongan_per_terlambat}
                                        onChange={(event) => setPolicy("potongan_per_terlambat", Number(event.target.value || 0))}
                                        placeholder="Nominal per kejadian"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea
                    value={data.catatan}
                    onChange={(event) => setData("catatan", event.target.value)}
                    rows={2}
                    placeholder="Opsional: catatan khusus payroll pegawai"
                />
                {errors.catatan ? <p className="text-xs text-destructive">{errors.catatan}</p> : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
