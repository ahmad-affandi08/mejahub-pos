import { CalendarDays, FileUp, Pill, Plane, RotateCw } from "lucide-react";
import { useState } from "react";

export default function RequestScreen({
    coworkers = [],
    onSubmitRequest,
    processing = false,
    requestHistory = [],
    incomingRequests = [],
    onRespondSwap,
}) {
    const [selectedType, setSelectedType] = useState("izin");
    const [form, setForm] = useState({
        tanggal_mulai: "",
        tanggal_selesai: "",
        alasan: "",
        pegawai_tujuan_id: "",
        lampiran: null,
    });
    const [lampiranError, setLampiranError] = useState("");

    const requestTypeOptions = [
        { key: "izin", label: "Izin", icon: CalendarDays },
        { key: "cuti", label: "Cuti", icon: Plane },
        { key: "tukar_shift", label: "Tukar Shift", icon: RotateCw },
    ];

    const submit = (event) => {
        event.preventDefault();

        if (lampiranError) {
            return;
        }

        onSubmitRequest?.({
            jenis_pengajuan: selectedType,
            tanggal_mulai: form.tanggal_mulai,
            tanggal_selesai: form.tanggal_selesai || form.tanggal_mulai,
            alasan: form.alasan,
            pegawai_tujuan_id: selectedType === "tukar_shift" ? form.pegawai_tujuan_id : null,
            lampiran: form.lampiran,
        });
    };

    const handleLampiranChange = (event) => {
        const selectedFile = event.target.files?.[0] ?? null;

        if (!selectedFile) {
            setForm((prev) => ({ ...prev, lampiran: null }));
            setLampiranError("");
            return;
        }

        const allowedMime = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedMime.includes(selectedFile.type)) {
            setLampiranError("Format lampiran harus PDF, JPG, atau PNG.");
            setForm((prev) => ({ ...prev, lampiran: null }));
            event.target.value = "";
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setLampiranError("Ukuran lampiran maksimal 5MB.");
            setForm((prev) => ({ ...prev, lampiran: null }));
            event.target.value = "";
            return;
        }

        setLampiranError("");
        setForm((prev) => ({ ...prev, lampiran: selectedFile }));
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div>
                <p className="font-[Georgia] text-3xl text-[#9c3a00]">Pengajuan Baru</p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-[#13101f]">Izin, Cuti, Tukar Shift</h2>
            </div>

            <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#767182]">PILIH JENIS PENGAJUAN</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    {requestTypeOptions.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.key}
                                type="button"
                                onClick={() => setSelectedType(type.key)}
                                className={[
                                    "rounded-2xl px-3 py-2.5 text-sm",
                                    selectedType === type.key ? "bg-[#fb8f56] text-[#3c1e11]" : "bg-[#ece8e3] text-[#4a4657]",
                                ].join(" ")}
                            >
                                <Icon className="mx-auto h-4 w-4" />
                                <span className="mt-1 block">{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#767182]">DURASI WAKTU</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#ece8e3] p-3">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#a04716]">TANGGAL MULAI</p>
                        <input
                            type="date"
                            value={form.tanggal_mulai}
                            onChange={(event) => setForm((prev) => ({ ...prev, tanggal_mulai: event.target.value }))}
                            className="mt-1.5 w-full bg-transparent text-sm font-bold text-[#13101f] outline-none"
                            required
                        />
                    </div>
                    <div className="rounded-2xl bg-[#ece8e3] p-3">
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#a04716]">TANGGAL SELESAI</p>
                        <input
                            type="date"
                            value={form.tanggal_selesai}
                            onChange={(event) => setForm((prev) => ({ ...prev, tanggal_selesai: event.target.value }))}
                            className="mt-1.5 w-full bg-transparent text-sm font-bold text-[#13101f] outline-none"
                            required={selectedType !== "izin"}
                        />
                    </div>
                </div>
            </div>

            {selectedType === "tukar_shift" ? (
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-[#767182]">PILIH REKAN TUKAR SHIFT</p>
                    <select
                        value={form.pegawai_tujuan_id}
                        onChange={(event) => setForm((prev) => ({ ...prev, pegawai_tujuan_id: event.target.value }))}
                        className="mt-2.5 h-10 w-full rounded-2xl bg-[#ece8e3] px-3 text-sm text-[#191622] outline-none"
                        required
                    >
                        <option value="">Pilih karyawan</option>
                        {coworkers.map((coworker) => (
                            <option key={coworker.id} value={coworker.id}>
                                {coworker.nama} {coworker.jabatan ? `- ${coworker.jabatan}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

            <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#767182]">KETERANGAN / ALASAN</p>
                <textarea
                    rows={4}
                    placeholder="Tuliskan alasan pengajuan Anda secara detail..."
                    value={form.alasan}
                    onChange={(event) => setForm((prev) => ({ ...prev, alasan: event.target.value }))}
                    className="mt-2.5 w-full rounded-2xl bg-[#d8d5d1] px-4 py-3 text-sm text-[#181523] placeholder:text-[#9f99a9] outline-none"
                    required
                />
            </div>

            <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#767182]">LAMPIRAN DOKUMEN (OPSIONAL)</p>
                <label htmlFor="lampiran-file" className="mt-2.5 block cursor-pointer rounded-2xl border-2 border-dashed border-[#dfd9ea] bg-[#f2efeb] px-4 py-7 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#d8c5f5]">
                        <FileUp className="h-6 w-6 text-[#22005f]" />
                    </div>
                    <p className="mt-3 text-lg font-semibold text-[#151220]">Klik untuk unggah berkas</p>
                    <p className="mt-1 text-xs text-[#7b7587]">PDF, JPG, PNG (Maks. 5MB)</p>
                </label>
                <input
                    id="lampiran-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleLampiranChange}
                    className="hidden"
                />
                {form.lampiran ? (
                    <p className="mt-2 text-xs text-[#2f006d]">File terpilih: {form.lampiran.name}</p>
                ) : null}
                {lampiranError ? (
                    <p className="mt-2 text-xs text-rose-700">{lampiranError}</p>
                ) : null}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22005f] px-4 py-3 text-sm font-semibold text-white"
            >
                {processing ? "MENGIRIM..." : "SUBMIT PENGAJUAN"}
                <Pill className="h-5 w-5 rotate-45" />
            </button>

            {requestHistory.length > 0 ? (
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#6e6779]">RIWAYAT PENGAJUAN</p>
                    <div className="mt-3 space-y-2">
                        {requestHistory.slice(0, 3).map((item) => (
                            <div key={item.id} className="rounded-2xl bg-[#f5f2ee] p-3 text-sm text-[#231f31]">
                                <p className="font-semibold uppercase">{item.jenis_pengajuan.replace("_", " ")}</p>
                                <p>{item.tanggal_mulai} - {item.tanggal_selesai}</p>
                                <p className="text-xs uppercase tracking-[0.15em] text-[#7a7388]">{item.status}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {incomingRequests?.length > 0 ? (
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#6e6779]">PERMINTAAN TUKAR SHIFT UNTUK ANDA</p>
                    <div className="mt-3 space-y-3">
                        {incomingRequests.slice(0, 5).map((item) => (
                            <div key={item.id} className="rounded-2xl bg-[#f5f2ee] p-3 text-sm text-[#231f31]">
                                <p className="font-semibold">{item.pengaju_nama || "Karyawan"}</p>
                                <p className="text-xs text-[#6f687b]">{item.pengaju_jabatan || ""}</p>
                                <p className="mt-1">{item.tanggal_mulai} - {item.tanggal_selesai}</p>
                                <p className="mt-1 text-xs">{item.alasan || "Tanpa catatan"}</p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onRespondSwap?.(item.id, "accept")}
                                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        Terima
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRespondSwap?.(item.id, "reject")}
                                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </form>
    );
}
