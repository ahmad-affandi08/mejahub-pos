import { Head, router, useForm } from "@inertiajs/react";
import PaginationSelect from "@/components/shared/pagination/PaginationSelect";
import { useState } from "react";
import { FileText, CreditCard } from "lucide-react";

import POSStatusBadge from "@/components/shared/pos/POSStatusBadge";
import { formatIDR } from "@/components/shared/pos/format";
import TableToolbar from "@/components/shared/table/TableToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/layouts/DashboardLayout";
import { financeMethodOptions } from "@/constants/paymentMethods";

export default function HutangIndex({ data, filters, flashMessage }) {
    const endpoint = "/finance/hutang";
    const searchValue = filters?.search ?? "";
    const statusFilter = filters?.status ?? "all";

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedHutang, setSelectedHutang] = useState(null);

    const { data: formData, setData, post, processing, reset, errors } = useForm({
        nominal_bayar: "",
        metode_pembayaran: "kas",
        tanggal_bayar: new Date().toISOString().split("T")[0],
        referensi: "",
        catatan: "",
    });

    const hasData = (data?.data ?? []).length > 0;

    const submitSearch = (event) => {
        event.preventDefault();
        const searchForm = new FormData(event.currentTarget);
        const search = (searchForm.get("search") || "").toString();

        router.get(
            endpoint,
            { search, status: statusFilter === "all" ? "" : statusFilter },
            { preserveState: true, replace: true }
        );
    };

    const handleStatusChange = (value) => {
        router.get(
            endpoint,
            { search: searchValue, status: value === "all" ? "" : value },
            { preserveState: true }
        );
    };

    const goPage = (page) => {
        router.get(
            endpoint,
            { search: searchValue, status: statusFilter === "all" ? "" : statusFilter, page },
            { preserveState: true }
        );
    };

    const openPaymentModal = (hutang) => {
        setSelectedHutang(hutang);
        setData({
            nominal_bayar: hutang.sisa_hutang,
            metode_pembayaran: "kas",
            tanggal_bayar: new Date().toISOString().split("T")[0],
            referensi: "",
            catatan: "",
        });
        setIsPaymentOpen(true);
    };

    const submitPayment = (e) => {
        e.preventDefault();
        post(`${endpoint}/${selectedHutang.id}/payment`, {
            onSuccess: () => {
                setIsPaymentOpen(false);
                reset();
            },
        });
    };

    return (
        <DashboardLayout title="Account Payable">
            <Head title="Hutang Supplier" />

            <div className="space-y-6">
                <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                                Finance
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                                Hutang Supplier
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Manajemen dan pelunasan tagihan supplier (Account Payable).
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                        <div className="flex-1 w-full max-w-sm">
                            <TableToolbar
                                searchValue={searchValue}
                                searchPlaceholder="Cari referensi hutang..."
                                onSubmit={submitSearch}
                                flashMessage={flashMessage?.success}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={handleStatusChange}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Status Tagihan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="unpaid">Belum Dibayar</SelectItem>
                                    <SelectItem value="partial">Sebagian (Cicilan)</SelectItem>
                                    <SelectItem value="paid">Lunas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode Tagihan</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tgl Hutang</TableHead>
                                    <TableHead>Jatuh Tempo</TableHead>
                                    <TableHead className="text-right">Total Tagihan</TableHead>
                                    <TableHead className="text-right">Sisa Hutang</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hasData ? (
                                    data.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {item.kode}
                                                </div>
                                                <span className="text-xs text-muted-foreground mt-1 block">
                                                    Ref: {item.sumber_tipe}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.supplier_nama}</TableCell>
                                            <TableCell>{item.tanggal_hutang || "-"}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={
                                                        item.status !== "paid" &&
                                                        new Date(item.jatuh_tempo) < new Date()
                                                            ? "text-red-500 font-bold"
                                                            : ""
                                                    }
                                                >
                                                    {item.jatuh_tempo || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatIDR(item.nominal_hutang)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-rose-500">
                                                {formatIDR(item.sisa_hutang)}
                                            </TableCell>
                                            <TableCell>
                                                <POSStatusBadge status={item.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.status !== "paid" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openPaymentModal(item)}
                                                    >
                                                        <CreditCard className="mr-2 h-4 w-4" /> Bayar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-12 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada data tagihan ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {data.meta && (
                        <PaginationSelect
                            currentPage={data?.meta?.current_page ?? 1}
                            lastPage={data?.meta?.last_page ?? 1}
                            total={data?.meta?.total ?? 0}
                            onPageChange={goPage}
                        />
                    )}
                </section>
            </div>

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pembayaran Tagihan / Cicilan</DialogTitle>
                        <DialogDescription>
                            Selesaikan pembayaran untuk {selectedHutang?.kode} dari{" "}
                            {selectedHutang?.supplier_nama}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitPayment} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sisa">Sisa Tagihan Saat Ini</Label>
                            <Input
                                id="sisa"
                                value={formatIDR(selectedHutang?.sisa_hutang)}
                                disabled
                                className="bg-muted font-bold"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nominal_bayar">Nominal Pembayaran</Label>
                            <Input
                                id="nominal_bayar"
                                type="number"
                                required
                                value={formData.nominal_bayar}
                                onChange={(e) => setData("nominal_bayar", e.target.value)}
                                max={selectedHutang?.sisa_hutang}
                                min="1"
                            />
                            {errors.nominal_bayar && (
                                <p className="text-sm text-destructive">
                                    {errors.nominal_bayar}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="metode_pembayaran">Metode Pembayaran</Label>
                            <Select
                                value={formData.metode_pembayaran}
                                onValueChange={(val) => setData("metode_pembayaran", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Metode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {financeMethodOptions.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.metode_pembayaran && (
                                <p className="text-sm text-destructive">
                                    {errors.metode_pembayaran}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tanggal_bayar">Tanggal Pembayaran</Label>
                            <Input
                                id="tanggal_bayar"
                                type="date"
                                value={formData.tanggal_bayar}
                                onChange={(e) => setData("tanggal_bayar", e.target.value)}
                            />
                            {errors.tanggal_bayar && (
                                <p className="text-sm text-destructive">
                                    {errors.tanggal_bayar}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="catatan">Catatan / Referensi (Opsional)</Label>
                            <Input
                                id="catatan"
                                placeholder="Bukti transfer, cek, dll"
                                value={formData.catatan}
                                onChange={(e) => setData("catatan", e.target.value)}
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPaymentOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Memproses..." : "Proses Pembayaran"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
