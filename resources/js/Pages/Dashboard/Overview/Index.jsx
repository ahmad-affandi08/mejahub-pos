import { Head } from "@inertiajs/react";

import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index({ summary }) {
    const cards = [
        { label: "Total User", value: summary?.total_user ?? 0 },
        { label: "Total Pegawai", value: summary?.total_pegawai ?? 0 },
        { label: "Total Kategori Menu", value: summary?.total_kategori_menu ?? 0 },
        { label: "Total Data Menu", value: summary?.total_data_menu ?? 0 },
    ];

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <section className="rounded-2xl border bg-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
                    <h1 className="mt-1 text-2xl font-semibold">Dashboard Mejahub POS</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ringkasan cepat performa data master pada sistem.
                    </p>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((item) => (
                        <Card key={item.label}>
                            <CardHeader>
                                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold">{item.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            </div>
        </DashboardLayout>
    );
}
