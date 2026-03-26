import { Head } from "@inertiajs/react";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index() {
    return (
        <DashboardLayout title="Status Masak">
            <Head title="Status Masak" />
            <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Kitchen</p>
                <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Status Masak</h1>
                <p className="mt-2 text-sm text-slate-600">Halaman frontend sudah disiapkan. Integrasi update status masak realtime akan dilanjutkan pada implementasi kitchen workflow.</p>
            </section>
        </DashboardLayout>
    );
}
