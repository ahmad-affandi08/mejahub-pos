import { Head } from "@inertiajs/react";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index() {
    return (
        <DashboardLayout title="Data Pelanggan">
            <Head title="Data Pelanggan" />
            <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">CRM</p>
                <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Data Pelanggan</h1>
                <p className="mt-2 text-sm text-slate-600">Halaman frontend sudah disiapkan. Integrasi data detail CRM akan dilanjutkan di batch implementasi CRM.</p>
            </section>
        </DashboardLayout>
    );
}
