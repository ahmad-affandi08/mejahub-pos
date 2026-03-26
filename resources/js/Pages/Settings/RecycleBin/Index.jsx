import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Index({ recycleBin, moduleOptions, filters, flashMessage }) {
    const endpoint = "/settings/recycle-bin";
    const searchValue = filters?.search ?? "";
    const moduleValue = filters?.module ?? "";
    const [selectedItems, setSelectedItems] = useState([]);

    const hasData = (recycleBin?.data ?? []).length > 0;
    const currentRows = recycleBin?.data ?? [];
    const toSelectionKey = (item) => JSON.stringify({ model_key: item.model_key, id: item.id });

    const selectedMap = useMemo(() => new Set(selectedItems), [selectedItems]);
    const allCurrentSelected = currentRows.length > 0 && currentRows.every((item) => selectedMap.has(toSelectionKey(item)));

    const submitSearch = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        router.get(
            endpoint,
            {
                search: (formData.get("search") || "").toString(),
                module: (formData.get("module") || "").toString(),
            },
            { preserveState: true, replace: true }
        );
    };

    const goPage = (page) => {
        router.get(
            endpoint,
            { search: searchValue, module: moduleValue, page },
            { preserveState: true }
        );
    };

    const runAction = (action, item) => {
        const message = action === "restore"
            ? "Pulihkan data ini dari Recycle Bin?"
            : "Hapus permanen data ini? Tindakan ini tidak bisa dibatalkan.";

        if (!window.confirm(message)) return;

        router.post(endpoint, {
            action,
            model_key: item.model_key,
            record_id: item.id,
        }, { preserveScroll: true });
    };

    const toggleRow = (item) => {
        const key = toSelectionKey(item);

        if (selectedMap.has(key)) {
            setSelectedItems((prev) => prev.filter((value) => value !== key));
            return;
        }

        setSelectedItems((prev) => [...prev, key]);
    };

    const toggleSelectAllCurrent = () => {
        if (allCurrentSelected) {
            const currentKeys = new Set(currentRows.map((item) => toSelectionKey(item)));
            setSelectedItems((prev) => prev.filter((value) => !currentKeys.has(value)));
            return;
        }

        setSelectedItems((prev) => {
            const merged = new Set(prev);
            currentRows.forEach((item) => merged.add(toSelectionKey(item)));
            return Array.from(merged);
        });
    };

    const forceDeleteSelected = () => {
        if (!selectedItems.length) {
            window.alert("Pilih minimal 1 data untuk dihapus permanen.");
            return;
        }

        if (!window.confirm(`Hapus permanen ${selectedItems.length} data terpilih? Tindakan ini tidak bisa dibatalkan.`)) {
            return;
        }

        const items = selectedItems
            .map((value) => {
                try {
                    const parsed = JSON.parse(value);

                    return {
                        model_key: String(parsed.model_key ?? ""),
                        record_id: Number(parsed.id ?? 0),
                    };
                } catch {
                    return null;
                }
            })
            .filter((item) => item && item.model_key && item.record_id > 0);

        if (!items.length) {
            window.alert("Data terpilih tidak valid. Coba pilih ulang data yang akan dihapus.");
            return;
        }

        router.post(endpoint, {
            action: "force_delete_bulk",
            items,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedItems([]),
            onError: () => window.alert("Hapus permanen bulk gagal. Cek data yang dipilih lalu coba lagi."),
        });
    };

    return (
        <DashboardLayout title="Recycle Bin">
            <Head title="Recycle Bin" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Settings</p>
                        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Recycle Bin</h1>
                        <p className="mt-1 text-sm text-slate-600">Kelola seluruh data soft delete. Data dapat dipulihkan atau dihapus permanen.</p>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <form onSubmit={submitSearch} className="flex w-full max-w-2xl gap-2">
                            <Input name="search" defaultValue={searchValue} placeholder="Cari modul, fitur, judul data" />
                            <select
                                name="module"
                                defaultValue={moduleValue}
                                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                            >
                                <option value="">Semua Modul</option>
                                {(moduleOptions ?? []).map((item) => (
                                    <option key={item.slug} value={item.slug}>{item.name}</option>
                                ))}
                            </select>
                            <Button variant="outline" type="submit">Cari</Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!selectedItems.length}
                                onClick={forceDeleteSelected}
                            >
                                Hapus Permanen Terpilih ({selectedItems.length})
                            </Button>
                            {flashMessage?.error || flashMessage?.success ? (
                                <p className={flashMessage?.error ? "rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>
                                    {flashMessage?.error ?? flashMessage?.success}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        <input type="checkbox" checked={allCurrentSelected} onChange={toggleSelectAllCurrent} />
                                    </TableHead>
                                    <TableHead>Modul</TableHead>
                                    <TableHead>Fitur</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Info</TableHead>
                                    <TableHead>Dihapus</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    recycleBin.data.map((item) => (
                                        <TableRow key={`${item.model_key}-${item.id}`}>
                                            <TableCell className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMap.has(toSelectionKey(item))}
                                                    onChange={() => toggleRow(item)}
                                                />
                                            </TableCell>
                                            <TableCell>{item.module_name}</TableCell>
                                            <TableCell>{item.feature_name}</TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="max-w-xs truncate">{item.subtitle}</TableCell>
                                            <TableCell>{item.deleted_at_human}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => runAction("restore", item)}>
                                                        Pulihkan
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => runAction("force_delete", item)}>
                                                        Hapus Permanen
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                            Recycle Bin kosong.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Halaman {recycleBin.meta.current_page} dari {recycleBin.meta.last_page} | Total {recycleBin.meta.total} data</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={recycleBin.meta.current_page <= 1} onClick={() => goPage(recycleBin.meta.current_page - 1)}>Sebelumnya</Button>
                            <Button variant="outline" size="sm" disabled={recycleBin.meta.current_page >= recycleBin.meta.last_page} onClick={() => goPage(recycleBin.meta.current_page + 1)}>Berikutnya</Button>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
