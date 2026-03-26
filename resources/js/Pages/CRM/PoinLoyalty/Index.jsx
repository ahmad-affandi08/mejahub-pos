import { Head } from "@inertiajs/react";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index() {
    return (
        <DashboardLayout title="Poin Loyalty">
            <Head title="Poin Loyalty" />
            <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">CRM</p>
                <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Poin Loyalty</h1>
                <p className="mt-2 text-sm text-slate-600">Halaman frontend sudah disiapkan. Integrasi kalkulasi dan histori poin akan dilanjutkan pada implementasi CRM.</p>
            </section>
        </DashboardLayout>
    );
}
