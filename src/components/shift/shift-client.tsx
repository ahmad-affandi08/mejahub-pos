"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Play,
  Square,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  User,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openShift, closeShift, addCashDrawerTransaction } from "@/actions/shift";

interface ActiveShift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number | string;
  closingCash: number | string | null;
  expectedCash: number | string | null;
  cashDifference: number | string | null;
  totalSales: number | string;
  totalOrders: number;
  notes: string | null;
  user: { id: string; name: string; role: string };
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number | string;
    status: string;
  }>;
  cashTransactions: Array<{
    id: string;
    type: string;
    amount: number | string;
    reason: string;
    createdAt: string;
  }>;
}

interface ShiftHistoryItem {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number | string;
  closingCash: number | string | null;
  expectedCash: number | string | null;
  cashDifference: number | string | null;
  totalSales: number | string;
  totalOrders: number;
  notes: string | null;
  user: { id: string; name: string; role: string };
  _count: { orders: number; cashTransactions: number };
}

interface ShiftClientProps {
  activeShift: ActiveShift | null;
  shiftHistory: ShiftHistoryItem[];
  userName: string;
}

export function ShiftClient({
  activeShift,
  shiftHistory,
  userName,
}: ShiftClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Open shift dialog
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [openNotes, setOpenNotes] = useState("");

  // Close shift dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  // Cash drawer dialog
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [cashType, setCashType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [cashAmount, setCashAmount] = useState("");
  const [cashReason, setCashReason] = useState("");

  const handleOpenShift = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("openingCash", openingCash || "0");
      if (openNotes) fd.set("notes", openNotes);

      const result = await openShift(fd);
      if (result.success) {
        toast.success("Shift dibuka!");
        setOpenDialogOpen(false);
        setOpeningCash("");
        setOpenNotes("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCloseShift = () => {
    if (!closingCash) {
      toast.error("Masukkan jumlah kas akhir");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("shiftId", activeShift!.id);
      fd.set("closingCash", closingCash);
      if (closeNotes) fd.set("notes", closeNotes);

      const result = await closeShift(fd);
      if (result.success) {
        toast.success("Shift ditutup!");
        setCloseDialogOpen(false);
        setClosingCash("");
        setCloseNotes("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCashDrawer = () => {
    if (!cashAmount || !cashReason) {
      toast.error("Lengkapi semua field");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("shiftId", activeShift!.id);
      fd.set("type", cashType);
      fd.set("amount", cashAmount);
      fd.set("reason", cashReason);

      const result = await addCashDrawerTransaction(fd);
      if (result.success) {
        toast.success(
          cashType === "CASH_IN" ? "Kas masuk dicatat" : "Kas keluar dicatat"
        );
        setCashDialogOpen(false);
        setCashAmount("");
        setCashReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Shift</h1>
          <p className="text-muted-foreground">
            Buka/tutup shift dan kelola kas laci
          </p>
        </div>
        {!activeShift ? (
          <Button onClick={() => setOpenDialogOpen(true)}>
            <Play className="mr-2 h-4 w-4" /> Buka Shift
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCashDialogOpen(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" /> Kas Laci
            </Button>
            <Button
              variant="destructive"
              onClick={() => setCloseDialogOpen(true)}
            >
              <Square className="mr-2 h-4 w-4" /> Tutup Shift
            </Button>
          </div>
        )}
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              Shift Aktif
              <Badge className="bg-green-100 text-green-800 ml-2">
                {userName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Mulai
                </p>
                <p className="font-medium">
                  {formatDate(new Date(activeShift.openedAt))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Modal Awal
                </p>
                <p className="font-medium">
                  {formatCurrency(Number(activeShift.openingCash))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Total Penjualan
                </p>
                <p className="font-medium text-green-600">
                  {formatCurrency(Number(activeShift.totalSales))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" /> Pesanan
                </p>
                <p className="font-medium">{activeShift.orders.length}</p>
              </div>
            </div>

            {/* Cash Drawer Transactions */}
            {activeShift.cashTransactions.length > 0 && (
              <>
                <Separator className="my-4" />
                <h4 className="text-sm font-semibold mb-3">
                  Transaksi Kas Laci
                </h4>
                <div className="space-y-2">
                  {activeShift.cashTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {txn.type === "CASH_IN" ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>{txn.reason}</span>
                      </div>
                      <span
                        className={
                          txn.type === "CASH_IN"
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {txn.type === "CASH_IN" ? "+" : "-"}
                        {formatCurrency(Number(txn.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Active Shift */}
      {!activeShift && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Tidak Ada Shift Aktif</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Buka shift terlebih dahulu untuk memulai transaksi
            </p>
            <Button
              className="mt-4"
              onClick={() => setOpenDialogOpen(true)}
            >
              <Play className="mr-2 h-4 w-4" /> Buka Shift Sekarang
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada riwayat shift
            </p>
          ) : (
            <div className="space-y-3">
              {shiftHistory.map((shift) => {
                const diff = Number(shift.cashDifference || 0);
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {shift.user.name}
                        </span>
                        <Badge
                          variant={shift.closedAt ? "secondary" : "default"}
                          className="text-[10px]"
                        >
                          {shift.closedAt ? "Selesai" : "Aktif"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(shift.openedAt))}
                        {shift.closedAt &&
                          ` — ${formatDate(new Date(shift.closedAt))}`}
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span>
                          Modal: {formatCurrency(Number(shift.openingCash))}
                        </span>
                        <span>Pesanan: {shift._count.orders}</span>
                        <span>
                          Sales: {formatCurrency(Number(shift.totalSales))}
                        </span>
                      </div>
                    </div>

                    {shift.closedAt && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Selisih</p>
                        <p
                          className={`text-sm font-bold flex items-center gap-1 ${
                            diff === 0
                              ? "text-green-600"
                              : diff > 0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {diff === 0 ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {diff >= 0 ? "+" : ""}
                          {formatCurrency(diff)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Shift Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Shift Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Modal Awal (Rp)</Label>
              <Input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                className="mt-1 text-right text-lg"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[100000, 200000, 300000, 500000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setOpeningCash(val.toString())}
                  >
                    {formatCurrency(val)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="Catatan shift..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleOpenShift} disabled={isPending}>
              {isPending ? "Memproses..." : "Buka Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift (Blind Close)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Hitung uang di laci kasir, lalu masukkan jumlahnya di bawah.
                Sistem akan menghitung selisih secara otomatis.
              </p>
            </div>
            <div>
              <Label>Kas Akhir di Laci (Rp)</Label>
              <Input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="Hitung dan masukkan jumlah uang"
                className="mt-1 text-right text-lg"
              />
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Catatan penutupan..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseShift}
              disabled={isPending}
            >
              {isPending ? "Memproses..." : "Tutup Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Drawer Dialog */}
      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaksi Kas Laci</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe</Label>
              <Select
                value={cashType}
                onValueChange={(v) => v && setCashType(v as "CASH_IN" | "CASH_OUT")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_IN">Kas Masuk</SelectItem>
                  <SelectItem value="CASH_OUT">Kas Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0"
                className="mt-1 text-right"
              />
            </div>
            <div>
              <Label>Alasan</Label>
              <Input
                value={cashReason}
                onChange={(e) => setCashReason(e.target.value)}
                placeholder="Contoh: Tukar uang kecil"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCashDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleCashDrawer} disabled={isPending}>
              {isPending ? "Memproses..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
