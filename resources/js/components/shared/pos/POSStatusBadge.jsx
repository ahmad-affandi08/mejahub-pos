const statusClassMap = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    open: "bg-sky-100 text-sky-700",
    closed: "bg-slate-200 text-slate-700",
    void: "bg-rose-100 text-rose-700",
};

export default function POSStatusBadge({ status }) {
    const normalized = String(status || "-").toLowerCase();
    const className = statusClassMap[normalized] ?? "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            {normalized}
        </span>
    );
}
