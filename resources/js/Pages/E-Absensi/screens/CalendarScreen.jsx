import { ChevronLeft, ChevronRight, CircleX, MapPin, NotebookText } from "lucide-react";
import { useMemo, useState } from "react";

const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const statusTone = {
    hadir: "bg-emerald-500 text-white",
    izin: "bg-sky-500 text-white",
    sakit: "bg-amber-500 text-white",
    alpha: "bg-rose-500 text-white",
    cuti: "bg-indigo-500 text-white",
    belum: "bg-[#e7e3ef] text-[#5e5770]",
    libur: "bg-[#efebe5] text-[#81798f]",
};

const statusLabel = {
    hadir: "Hadir",
    izin: "Izin",
    sakit: "Sakit",
    alpha: "Alpha",
    cuti: "Cuti",
    belum: "Belum",
    libur: "Libur",
};

export default function CalendarScreen({ calendarData, loading = false, onChangeMonth }) {
    const monthLabel = calendarData?.month_label || "-";
    const days = calendarData?.days || [];
    const summary = calendarData?.summary || {};
    const prevMonthKey = calendarData?.prev_month_key;
    const nextMonthKey = calendarData?.next_month_key;
    const [selectedDay, setSelectedDay] = useState(null);

    const firstDow = days.length > 0 ? Number(days[0]?.dow || 1) : 1;
    const leadingBlanks = Math.max(firstDow - 1, 0);
    const cells = [
        ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, empty: true })),
        ...days.map((item) => ({ ...item, key: item.date, empty: false })),
    ];

    const selectedStatusLabel = useMemo(() => {
        if (!selectedDay) {
            return "-";
        }

        return statusLabel[selectedDay.status] || "-";
    }, [selectedDay]);

    return (
        <div className="space-y-4">
            <div>
                <p className="font-[Georgia] text-3xl text-[#9c3a00]">Kalender Staff</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onChangeMonth?.(prevMonthKey)}
                        disabled={loading || !prevMonthKey}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5cfdf] bg-[#efebe5] text-[#2f006d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-2xl font-black leading-tight text-[#13101f]">{monthLabel}</h2>
                    <button
                        type="button"
                        onClick={() => onChangeMonth?.(nextMonthKey)}
                        disabled={loading || !nextMonthKey}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d5cfdf] bg-[#efebe5] text-[#2f006d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
                {loading ? <p className="mt-2 text-xs text-[#6d6778]">Memuat kalender...</p> : null}
            </div>

            <div className="grid grid-cols-5 gap-2 rounded-2xl bg-[#ece8e3] p-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-700">Hadir</p>
                    <p className="text-lg font-bold text-emerald-900">{summary.hadir ?? 0}</p>
                </div>
                <div className="rounded-xl bg-sky-100 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sky-700">Izin</p>
                    <p className="text-lg font-bold text-sky-900">{summary.izin ?? 0}</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700">Sakit</p>
                    <p className="text-lg font-bold text-amber-900">{summary.sakit ?? 0}</p>
                </div>
                <div className="rounded-xl bg-rose-100 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-rose-700">Alpha</p>
                    <p className="text-lg font-bold text-rose-900">{summary.alpha ?? 0}</p>
                </div>
                <div className="rounded-xl bg-indigo-100 p-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-indigo-700">Cuti</p>
                    <p className="text-lg font-bold text-indigo-900">{summary.cuti ?? 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#6d6778]">
                {dayNames.map((label) => (
                    <div key={label} className="py-1">{label}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell) => {
                    if (cell.empty) {
                        return <div key={cell.key} className="h-18 rounded-xl bg-transparent" />;
                    }

                    const toneClass = statusTone[cell.status] || statusTone.libur;
                    const label = statusLabel[cell.status] || "-";
                    const shiftText = cell.shift_name
                        ? `${cell.shift_name} ${cell.shift_entry || "-"}-${cell.shift_exit || "-"}`
                        : "Tanpa Shift";

                    return (
                        <button
                            key={cell.key}
                            type="button"
                            onClick={() => setSelectedDay(cell)}
                            className="h-18 w-full rounded-xl bg-[#f1ede8] p-1.5 text-left"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-[#1a1625]">{cell.day}</p>
                                <span className={["rounded-full px-1.5 py-0.5 text-[9px] font-semibold", toneClass].join(" ")}>{label}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-[#5f586d]">{shiftText}</p>
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-[#6d6778]">Keterangan: status Alpha otomatis untuk tanggal lewat yang memiliki shift namun belum ada absensi.</p>

            {selectedDay ? (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3">
                    <div className="w-full max-w-md rounded-3xl bg-[#f8f6f2] p-4 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs tracking-[0.18em] text-[#7a7388]">DETAIL TANGGAL</p>
                                <h3 className="mt-1 text-xl font-black text-[#171321]">{selectedDay.date}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDay(null)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ece8e3] text-[#5b546b]"
                            >
                                <CircleX className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-3 rounded-2xl bg-[#ece8e3] p-3 text-sm text-[#1b1627]">
                            <p><span className="font-semibold">Status:</span> {selectedStatusLabel}</p>
                            <p className="mt-1"><span className="font-semibold">Shift:</span> {selectedDay.shift_name || "Tanpa Shift"}</p>
                            <p className="mt-1"><span className="font-semibold">Jam Shift:</span> {(selectedDay.shift_entry || "-") + " - " + (selectedDay.shift_exit || "-")}</p>
                            <p className="mt-1"><span className="font-semibold">Jam Masuk:</span> {selectedDay.jam_masuk || "-"}</p>
                            <p className="mt-1"><span className="font-semibold">Jam Keluar:</span> {selectedDay.jam_keluar || "-"}</p>
                            <p className="mt-1"><span className="font-semibold">Metode:</span> {selectedDay.metode_absen ? String(selectedDay.metode_absen).toUpperCase() : "-"}</p>
                        </div>

                        <div className="mt-3 rounded-2xl bg-[#f0edf8] p-3 text-xs text-[#2f006d]">
                            <p className="inline-flex items-center gap-1.5 font-semibold"><MapPin className="h-3.5 w-3.5" />Lokasi</p>
                            <p className="mt-1 text-[#4f4961]">{selectedDay.lokasi_absen || "Tidak tersedia"}</p>
                            <p className="mt-2 inline-flex items-center gap-1.5 font-semibold"><NotebookText className="h-3.5 w-3.5" />Keterangan</p>
                            <p className="mt-1 text-[#4f4961]">{selectedDay.keterangan || "-"}</p>
                        </div>

                        {selectedDay.foto_url ? (
                            <div className="mt-3 overflow-hidden rounded-2xl border border-[#ddd7e8] bg-white">
                                <img src={selectedDay.foto_url} alt="Foto absensi" className="h-40 w-full object-cover" />
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
