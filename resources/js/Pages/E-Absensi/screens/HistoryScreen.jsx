import { CalendarRange, ChevronRight, Search } from "lucide-react";

export default function HistoryScreen({ records, activeFilter, onFilterChange, onOpenDetail }) {
    const filters = [
        { key: "all", label: "Semua" },
        { key: "week", label: "Minggu Ini" },
        { key: "month", label: "Bulan Ini" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-2xl bg-[#d8d5d1] px-3 py-2.5 text-[#6c6978]">
                <Search className="h-4 w-4" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan tanggal atau status..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#7f7a88]"
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                {filters.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => onFilterChange(item.key)}
                        className={[
                            "rounded-full px-2.5 py-1.5 text-xs font-medium",
                            activeFilter === item.key ? "bg-[#2c0069] text-white" : "bg-[#ece8e3] text-[#373448]",
                        ].join(" ")}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold text-[#16131e]">Log Terbaru</h3>
                <span className="font-mono text-xs text-[#817b8d]">UTC +07:00</span>
            </div>

            <div className="space-y-3">
                {records.map((record) => (
                    <button
                        key={record.id}
                        type="button"
                        onClick={() => onOpenDetail(record)}
                        className="w-full rounded-2xl bg-[#efece7] p-4 text-left"
                    >
                        <div className="flex items-start justify-between">
                            <p className="font-mono text-sm text-[#a04016]">{record.dateShort}</p>
                            <span className="rounded-full bg-[#f0d7c8] px-3 py-1 text-xs font-semibold text-[#8f2f0b]">HADIR</span>
                        </div>
                        <h4 className="mt-2 text-2xl font-bold text-[#111]">{record.type}</h4>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] tracking-[0.2em] text-[#a9a0b6]">WAKTU</p>
                                    <p className="font-mono text-xl text-[#151220]">{record.time.slice(0, 5)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] tracking-[0.2em] text-[#a9a0b6]">SHIFT</p>
                                    <p className="text-lg text-[#151220]">{record.shift}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#c0bacd]" />
                        </div>
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-dashed border-[#ddd7e5] bg-[#f4f2ee] px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e4e0db]">
                    <CalendarRange className="h-6 w-6 text-[#827d8d]" />
                </div>
                <p className="mt-3 text-xl font-bold text-[#1a1625]">Tidak ada data lebih lama</p>
                <p className="mt-1 text-sm text-[#6d6778]">Data lebih dari 30 hari diarsipkan otomatis.</p>
            </div>
        </div>
    );
}
