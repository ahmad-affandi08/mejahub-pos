import {
    CalendarDays,
    CalendarClock,
    House,
    ListChecks,
    NotebookPen,
    UserRound,
} from "lucide-react";

const navItems = [
    { key: "home", label: "Beranda", icon: House },
    { key: "calendar", label: "Kalender", icon: CalendarDays },
    { key: "history", label: "Riwayat", icon: ListChecks },
    { key: "requests", label: "Pengajuan", icon: CalendarClock },
    { key: "profile", label: "Profil", icon: UserRound },
];

export default function BottomNav({ active, onChange }) {
    return (
        <div className="rounded-[20px] bg-[#efedf5] p-1.5">
            <div className="grid grid-cols-5 gap-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onChange(item.key)}
                            className={[
                                "flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2.5 text-xs font-medium transition",
                                isActive
                                    ? "bg-[#2f006d] text-white shadow-[0_8px_18px_rgba(47,0,109,0.35)]"
                                    : "text-[#8a95ad] hover:bg-white/70",
                            ].join(" ")}
                        >
                            {isActive && item.key === "requests" ? <NotebookPen className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
