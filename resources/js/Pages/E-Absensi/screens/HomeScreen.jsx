import { Fingerprint, MapPin } from "lucide-react";

function resolveGreetingPeriod(serverTime) {
    let hour = new Date().getHours();

    if (typeof serverTime === "string") {
        const [hh] = serverTime.split(":");
        const parsed = Number.parseInt(hh, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 23) {
            hour = parsed;
        }
    }

    if (hour >= 4 && hour < 11) return "pagi";
    if (hour >= 11 && hour < 15) return "siang";
    if (hour >= 15 && hour < 18) return "sore";
    return "malam";
}

export default function HomeScreen({ profile, shiftInfo, summary, checkinStatus, primaryAction, canAttend = true, serverTime, onStartCheckout }) {
    const greetingPeriod = resolveGreetingPeriod(serverTime);
    const actionLabel = primaryAction || "ABSEN MASUK";
    const isDoneToday = actionLabel === "SUDAH ABSEN";
    const isActionDisabled = isDoneToday || !canAttend;

    return (
        <div className="space-y-5">
            <section className="space-y-3">
                <h2 className="font-[Georgia] text-3xl leading-tight text-[#9c3a00]">Selamat {greetingPeriod}, {profile.name.split(" ")[0]}!</h2>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#ece8e3] px-3 py-1.5 text-xs text-[#474453]">
                    <MapPin className="h-4 w-4 text-[#2f006d]" />
                    <span>GPS stabil, verifikasi wajah siap</span>
                </div>
            </section>

            <section className="rounded-3xl bg-[#ece8e3] p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-2xl font-bold text-[#151220]">{shiftInfo.title}</p>
                        <p className="mt-1 text-sm text-[#4b4758]">{shiftInfo.date}</p>
                    </div>
                    <span className="rounded-2xl bg-[#32006f] px-3 py-1.5 font-mono text-sm text-[#8f7fb0]">{shiftInfo.code}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-[#f8f6f2] p-3">
                        <p className="text-[10px] tracking-[0.2em] text-[#656175]">MASUK</p>
                        <p className="mt-1.5 font-mono text-2xl text-[#12101e]">{shiftInfo.entry}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f8f6f2] p-3">
                        <p className="text-[10px] tracking-[0.2em] text-[#656175]">PULANG</p>
                        <p className="mt-1.5 font-mono text-2xl text-[#12101e]">{shiftInfo.exit}</p>
                    </div>
                </div>
            </section>

            <section className="text-center">
                <p className="text-xs tracking-[0.24em] text-[#4d4a58]">STATUS SAAT INI</p>
                <h3 className="mt-2 text-3xl font-black text-[#d01f1f]">{checkinStatus}</h3>
                <button
                    type="button"
                    onClick={onStartCheckout}
                    disabled={isActionDisabled}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#22005f] px-5 py-3 text-base font-semibold tracking-wide text-white shadow-[0_10px_20px_rgba(34,0,95,0.3)] disabled:cursor-not-allowed disabled:bg-[#8a7aa8] disabled:shadow-none"
                >
                    <Fingerprint className="h-5 w-5" />
                    {actionLabel}
                </button>
            </section>

            <section>
                <h4 className="text-2xl font-bold text-[#181423]">Ringkasan Mingguan</h4>
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {summary.map((item) => (
                        <div
                            key={item.label}
                            className={[
                                "rounded-2xl p-3 text-center",
                                item.tone === "warn" ? "bg-[#f2dbcc] text-[#9c4f00]" : "bg-[#efede9] text-[#161320]",
                            ].join(" ")}
                        >
                            <p className="font-mono text-3xl font-semibold">{item.value}</p>
                            <p className="mt-1 text-xs">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
