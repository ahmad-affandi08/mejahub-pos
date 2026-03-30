import { useState, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export default function DraftReviewMatrix({ drafts, pegawaiOptions, shiftOptions, endpoint, onSuccess, onCancel }) {
    const [saving, setSaving] = useState(false);
    
    // Convert drafts to a matrix state: { "pegawaiId_tanggal": shiftId }
    const [draftMatrix, setDraftMatrix] = useState(() => {
        const initial = {};
        drafts.forEach((d) => {
            initial[`${d.pegawai_id}_${d.tanggal}`] = d.shift_id || "";
        });
        return initial;
    });

    const tanggals = useMemo(() => {
        const t = new Set(drafts.map((d) => d.tanggal));
        return Array.from(t).sort();
    }, [drafts]);

    const pegawais = useMemo(() => {
        const pIds = new Set(drafts.map((d) => d.pegawai_id));
        return pegawaiOptions.filter((p) => pIds.has(p.id));
    }, [drafts, pegawaiOptions]);

    const handleCellChange = (pegawaiId, tanggal, value) => {
        setDraftMatrix((prev) => ({
            ...prev,
            [`${pegawaiId}_${tanggal}`]: value === "L" ? "" : parseInt(value),
        }));
    };

    const submitDrafts = async () => {
        setSaving(true);
        const payloadItems = [];
        
        pegawais.forEach((p) => {
            tanggals.forEach((t) => {
                const shiftId = draftMatrix[`${p.id}_${t}`];
                payloadItems.push({
                    pegawai_id: p.id,
                    tanggal: t,
                    shift_id: shiftId ? parseInt(shiftId) : null,
                });
            });
        });

        try {
            await axios.post(`${endpoint}/bulk`, { items: payloadItems });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menyimpan draft.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh]">
            <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                Tinjau dan sesuaikan jadwal yang di-generate. Ubah Shift per tanggal jika perlu, lalu tekan Simpan.
            </div>

            <div className="flex-1 overflow-auto border rounded-xl relative">
                <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                        <tr>
                            <th className="p-2 border-r border-b min-w-[150px] font-semibold sticky left-0 bg-slate-100 z-20">Pegawai</th>
                            {tanggals.map((t) => (
                                <th key={t} className="p-2 border-r border-b text-center font-semibold min-w-[80px]">
                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                        {new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(t))}
                                    </div>
                                    <div>{new Date(t).getDate()}/{new Date(t).getMonth() + 1}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pegawais.map((p, pIndex) => (
                            <tr key={p.id} className="border-b hover:bg-slate-50">
                                <td className="p-2 border-r sticky left-0 bg-white shadow-[1px_0_0_0_#f1f5f9] z-10">
                                    <div className="font-medium text-slate-900">{p.nama}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{p.jabatan || "-"}</div>
                                </td>
                                {tanggals.map((t) => {
                                    const val = draftMatrix[`${p.id}_${t}`] || "L";
                                    // simple dynamic border/color based on shift
                                    return (
                                        <td key={`${p.id}_${t}`} className="p-1 border-r text-center">
                                            <select
                                                className="w-full h-8 px-1 text-xs bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded cursor-pointer"
                                                value={val}
                                                onChange={(e) => handleCellChange(p.id, t, e.target.value)}
                                            >
                                                <option value="L">Libur</option>
                                                {shiftOptions.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.kode || s.nama}</option>
                                                ))}
                                            </select>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="button" disabled={saving} onClick={submitDrafts}>
                    {saving ? "Menyimpan..." : "Simpan Jadwal"}
                </Button>
            </DialogFooter>
        </div>
    );
}
