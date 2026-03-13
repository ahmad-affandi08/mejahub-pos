"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { QrCode, Download } from "lucide-react";
import type { TableStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  createTable,
  deleteTable,
  updateTable,
  updateTableStatus,
} from "@/actions/table";

const statusColors: Record<TableStatus, string> = {
  AVAILABLE: "border-green-500 bg-green-50 dark:bg-green-950/20",
  OCCUPIED: "border-red-500 bg-red-50 dark:bg-red-950/20",
  WAITING_FOOD: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
  REQUESTING_BILL: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
  RESERVED: "border-purple-500 bg-purple-50 dark:bg-purple-950/20",
};

const statusBadgeColors: Record<
  TableStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  AVAILABLE: "secondary",
  OCCUPIED: "destructive",
  WAITING_FOOD: "default",
  REQUESTING_BILL: "default",
  RESERVED: "outline",
};

const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: "Kosong",
  OCCUPIED: "Terisi",
  WAITING_FOOD: "Menunggu Makanan",
  REQUESTING_BILL: "Minta Tagihan",
  RESERVED: "Dipesan",
};

interface TableData {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: TableStatus;
  qrCode: string | null;
  orders: {
    id: string;
    orderNumber: string;
    totalAmount: unknown;
    items: { id: string }[];
  }[];
}

interface TableGridProps {
  tables: TableData[];
  branchId: string;
}

export function TableGrid({ tables, branchId }: TableGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrDialog, setQrDialog] = useState<TableData | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [positionX, setPositionX] = useState("0");
  const [positionY, setPositionY] = useState("0");

  const handleDownloadQR = (table: TableData) => {
    const link = document.createElement("a");
    link.href = `/api/qr/${table.id}`;
    link.download = `qr-meja-${table.number}.png`;
    link.click();
  };

  function openCreateDialog() {
    setEditingTable(null);
    setNumber("");
    setName("");
    setCapacity("4");
    setPositionX("0");
    setPositionY("0");
    setTableDialogOpen(true);
  }

  function openEditDialog(table: TableData) {
    setEditingTable(table);
    setNumber(String(table.number));
    setName(table.name ?? "");
    setCapacity(String(table.capacity));
    setPositionX("0");
    setPositionY("0");
    setTableDialogOpen(true);
  }

  function handleSaveTable() {
    if (!number) {
      toast.error("Nomor meja wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("number", number);
      if (name.trim()) {
        formData.set("name", name.trim());
      }
      formData.set("capacity", capacity || "4");
      formData.set("positionX", positionX || "0");
      formData.set("positionY", positionY || "0");
      if (!editingTable) {
        formData.set("branchId", branchId);
      }

      const result = editingTable
        ? await updateTable(editingTable.id, formData)
        : await createTable(formData);

      if (result.success) {
        toast.success(editingTable ? "Meja diperbarui" : "Meja ditambahkan");
        setTableDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteTable(table: TableData) {
    if (!window.confirm(`Hapus meja #${table.number}?`)) return;

    startTransition(async () => {
      const result = await deleteTable(table.id);
      if (result.success) {
        toast.success("Meja dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleStatusChange(table: TableData, status: TableStatus) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("status", status);

      const result = await updateTableStatus(table.id, formData);
      if (result.success) {
        toast.success("Status meja diperbarui");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreateDialog}>Tambah Meja</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables.map((table) => {
          const activeOrder = table.orders[0];
          const itemCount = activeOrder?.items?.length ?? 0;
          const total = Number(activeOrder?.totalAmount ?? 0);

          return (
            <Card
              key={table.id}
              className={cn(
                "cursor-pointer border-2 transition-all hover:shadow-md",
                statusColors[table.status]
              )}
            >
              <CardHeader className="space-y-0 p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    #{table.number}
                  </CardTitle>
                  <Badge
                    variant={statusBadgeColors[table.status]}
                    className="text-xs"
                  >
                    {statusLabels[table.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground truncate">
                  {table.name || `Meja ${table.number}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Kapasitas: {table.capacity}
                </p>
                {activeOrder && (
                  <div className="mt-2 rounded-md bg-background/80 p-2 text-xs">
                    <p className="font-medium">{activeOrder.orderNumber}</p>
                    <p>
                      {itemCount} item &bull; {formatCurrency(total)}
                    </p>
                  </div>
                )}
                {/* QR Code Button */}
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrDialog(table);
                    }}
                  >
                    <QrCode className="mr-1 h-3 w-3" />
                    QR Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditDialog(table);
                    }}
                  >
                    Edit
                  </Button>
                </div>

                <div className="mt-2">
                  <Select
                    value={table.status}
                    onValueChange={(value) =>
                      handleStatusChange(table, value as TableStatus)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <span className="line-clamp-1 flex flex-1 items-center text-left">
                        {statusLabels[table.status]}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Kosong</SelectItem>
                      <SelectItem value="OCCUPIED">Terisi</SelectItem>
                      <SelectItem value="WAITING_FOOD">Menunggu Makanan</SelectItem>
                      <SelectItem value="REQUESTING_BILL">Minta Tagihan</SelectItem>
                      <SelectItem value="RESERVED">Dipesan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-full text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteTable(table);
                    }}
                    disabled={isPending}
                  >
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              QR Code - Meja #{qrDialog?.number}
            </DialogTitle>
          </DialogHeader>
          {qrDialog && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code Image */}
              <div className="rounded-lg border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr/${qrDialog.id}`}
                  alt={`QR Code Meja ${qrDialog.number}`}
                  width={300}
                  height={300}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {qrDialog.name || `Meja ${qrDialog.number}`}
                </p>
                <p className="text-xs mt-1">
                  Scan QR code ini untuk pesan langsung dari meja
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => handleDownloadQR(qrDialog)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Meja" : "Tambah Meja"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Nomor Meja</p>
                <Input
                  type="number"
                  min={1}
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Kapasitas</p>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Nama Meja</p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Meja VIP 1"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Posisi X</p>
                <Input
                  type="number"
                  value={positionX}
                  onChange={(event) => setPositionX(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Posisi Y</p>
                <Input
                  type="number"
                  value={positionY}
                  onChange={(event) => setPositionY(event.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveTable} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
