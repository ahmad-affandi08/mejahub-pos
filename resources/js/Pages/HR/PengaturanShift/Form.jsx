import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        jam_masuk: initialValues?.jam_masuk ?? "",
        jam_keluar: initialValues?.jam_keluar ?? "",
        toleransi_telat_menit: initialValues?.toleransi_telat_menit ?? 0,
        toleransi_pulang_cepat_menit: initialValues?.toleransi_pulang_cepat_menit ?? 0,
        lintas_hari: initialValues?.lintas_hari ?? false,
        latitude: initialValues?.latitude ?? "",
        longitude: initialValues?.longitude ?? "",
        radius_meter: initialValues?.radius_meter ?? 100,
        require_face_verification: initialValues?.require_face_verification ?? false,
        require_location_validation: initialValues?.require_location_validation ?? true,
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
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} placeholder="Contoh: SHIFT-PAGI" />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Shift</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jam Masuk</label>
                    <Input type="time" value={data.jam_masuk} onChange={(event) => setData("jam_masuk", event.target.value)} required />
                    {errors.jam_masuk ? <p className="text-xs text-destructive">{errors.jam_masuk}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Jam Keluar</label>
                    <Input type="time" value={data.jam_keluar} onChange={(event) => setData("jam_keluar", event.target.value)} required />
                    {errors.jam_keluar ? <p className="text-xs text-destructive">{errors.jam_keluar}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lintas Hari</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.lintas_hari ? "1" : "0"} onChange={(event) => setData("lintas_hari", event.target.value === "1")}>
                        <option value="0">Tidak</option>
                        <option value="1">Ya</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Toleransi Telat (Menit)</label>
                    <Input type="number" min={0} value={data.toleransi_telat_menit} onChange={(event) => setData("toleransi_telat_menit", Number(event.target.value || 0))} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Toleransi Pulang Cepat (Menit)</label>
                    <Input type="number" min={0} value={data.toleransi_pulang_cepat_menit} onChange={(event) => setData("toleransi_pulang_cepat_menit", Number(event.target.value || 0))} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input value={data.latitude} onChange={(event) => setData("latitude", event.target.value)} placeholder="-6.2000000" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input value={data.longitude} onChange={(event) => setData("longitude", event.target.value)} placeholder="106.8166667" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Radius (meter)</label>
                    <Input type="number" min={1} value={data.radius_meter} onChange={(event) => setData("radius_meter", Number(event.target.value || 100))} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Verifikasi Wajah</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.require_face_verification ? "1" : "0"} onChange={(event) => setData("require_face_verification", event.target.value === "1")}>
                        <option value="0">Opsional</option>
                        <option value="1">Wajib</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Validasi Lokasi</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.require_location_validation ? "1" : "0"} onChange={(event) => setData("require_location_validation", event.target.value === "1")}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status Shift</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
