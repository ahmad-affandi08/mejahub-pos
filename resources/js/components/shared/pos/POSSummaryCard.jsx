export default function POSSummaryCard({ label, value, tone = "slate" }) {
    const toneMap = {
        slate: "border-slate-200 bg-slate-50 text-slate-800",
        orange: "border-orange-200 bg-orange-50 text-orange-800",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
        sky: "border-sky-200 bg-sky-50 text-sky-800",
    };

    return (
        <article className={`rounded-xl border px-3 py-2 ${toneMap[tone] ?? toneMap.slate}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </article>
    );
}
