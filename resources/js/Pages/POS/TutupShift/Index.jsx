import { Head, router } from "@inertiajs/react";
import { useState } from "react";

import MoneyText from "@/components/shared/pos/MoneyText";
import POSSummaryCard from "@/components/shared/pos/POSSummaryCard";
import POSLayout from "@/layouts/POSLayout";
import Form from "@/Pages/POS/TutupShift/Form";

export default function Index({ activeShift, summary, shiftReports = [], filters = {}, pagination = {}, flashMessage }) {
    const [values, setValues] = useState({
        kasAktual: "",
        catatan: "",
    });

    const [reportFilters, setReportFilters] = useState({
        search: filters.search || "",
        dateFrom: filters.date_from || "",
        dateTo: filters.date_to || "",
        perPage: String(filters.per_page || 20),
    });

    const handleChange = (field, value) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const submit = (event) => {
        event.preventDefault();

        if (!activeShift) {
            window.alert("Tidak ada shift aktif.");
            return;
        }

        router.post("/pos/tutup-shift", {
            kas_aktual: Number(values.kasAktual || 0),
            catatan_tutup: values.catatan || null,
        }, { preserveScroll: true });
    };

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = (event) => {
        event.preventDefault();

        router.get("/pos/tutup-shift", {
            search: reportFilters.search || undefined,
            date_from: reportFilters.dateFrom || undefined,
            date_to: reportFilters.dateTo || undefined,
            per_page: Number(reportFilters.perPage || 20),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <POSLayout title="Tutup Shift">
            <Head title="POS - Tutup Shift" />

            <div className="mx-auto mb-4 grid max-w-3xl gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Shift Aktif" value={activeShift ? "Ya" : "Tidak"} tone="sky" />
                <POSSummaryCard label="Input Kas Aktual" value={values.kasAktual ? `Rp ${values.kasAktual}` : "Rp 0"} tone="orange" />
                <POSSummaryCard label="Transaksi Shift" value={String(summary?.transaksi_total ?? 0)} tone="slate" />
            </div>

            <div className="mx-auto mb-4 grid max-w-3xl gap-2 sm:grid-cols-3">
                <POSSummaryCard label="Cash" value={<MoneyText value={summary?.cash_total || 0} />} tone="emerald" />
                <POSSummaryCard label="Non-Cash" value={<MoneyText value={summary?.non_cash_total || 0} />} tone="sky" />
                <POSSummaryCard label="Expected Drawer" value={<MoneyText value={summary?.expected_drawer || 0} />} tone="orange" />
            </div>

            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Closing Shift Kasir</h2>
                <p className="mt-1 text-sm text-slate-500">Rekonsiliasi kas aktual dengan perhitungan sistem.</p>

                {flashMessage?.success ? (
                    <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {flashMessage.success}
                    </p>
                ) : null}

                <Form
                    values={values}
                    state={{ activeShift, summary }}
                    onChange={handleChange}
                    onSubmit={submit}
                />
            </div>

            <section className="mx-auto mt-4 max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Laporan Shift</h2>
                    <p className="text-sm text-slate-500">
                        Total data: {pagination.total ?? shiftReports.length}
                    </p>
                </div>

                <form onSubmit={applyFilters} className="mt-3 grid gap-2 md:grid-cols-5">
                    <input
                        type="text"
                        value={reportFilters.search}
                        onChange={(event) => handleFilterChange("search", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Cari kode/status/catatan"
                    />
                    <input
                        type="date"
                        value={reportFilters.dateFrom}
                        onChange={(event) => handleFilterChange("dateFrom", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                        type="date"
                        value={reportFilters.dateTo}
                        onChange={(event) => handleFilterChange("dateTo", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <select
                        value={reportFilters.perPage}
                        onChange={(event) => handleFilterChange("perPage", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="10">10 / halaman</option>
                        <option value="20">20 / halaman</option>
                        <option value="50">50 / halaman</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Terapkan Filter
                    </button>
                </form>

                <div className="mt-3 overflow-auto">
                    <table className="w-full min-w-170 text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-2">Kode</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Waktu Buka</th>
                                <th className="py-2">Waktu Tutup</th>
                                <th className="py-2">Kas Awal</th>
                                <th className="py-2">Kas Aktual</th>
                                <th className="py-2">Selisih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shiftReports.map((item) => (
                                <tr key={item.id} className="border-b last:border-b-0">
                                    <td className="py-2 font-medium">{item.kode}</td>
                                    <td className="py-2">{item.status}</td>
                                    <td className="py-2">{item.waktu_buka || "-"}</td>
                                    <td className="py-2">{item.waktu_tutup || "-"}</td>
                                    <td className="py-2"><MoneyText value={item.kas_awal} /></td>
                                    <td className="py-2"><MoneyText value={item.kas_aktual || 0} /></td>
                                    <td className="py-2"><MoneyText value={item.selisih || 0} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {shiftReports.length === 0 ? (
                        <p className="pt-3 text-sm text-slate-500">Belum ada data laporan shift.</p>
                    ) : null}
                </div>
            </section>
        </POSLayout>
    );
}
