const statusClassMap = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    open: "bg-sky-100 text-sky-700",
    closed: "bg-slate-200 text-slate-700",
    void: "bg-rose-100 text-rose-700",
    aktif: "bg-emerald-100 text-emerald-700",
    active: "bg-emerald-100 text-emerald-700",
    nonaktif: "bg-rose-100 text-rose-700",
    inactive: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    seated: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    done: "bg-slate-200 text-slate-700",
    merged: "bg-violet-100 text-violet-700",
    voided: "bg-rose-100 text-rose-700",
    processed: "bg-indigo-100 text-indigo-700",
    refunded: "bg-teal-100 text-teal-700",
};

export default function POSStatusBadge({ status, label }) {
    const normalized = String(status || "-").toLowerCase();
    const className = statusClassMap[normalized] ?? "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            {label ?? normalized}
        </span>
    );
}
