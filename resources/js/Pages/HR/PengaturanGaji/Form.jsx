import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, pegawaiOptions, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors } = useForm({
        pegawai_id: initialValues?.pegawai_id ?? "",
        gaji_pokok: initialValues?.gaji_pokok ?? 0,
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
