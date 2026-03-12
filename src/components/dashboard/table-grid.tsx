"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { QrCode, Download } from "lucide-react";
import type { TableStatus } from "@prisma/client";

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
  WAITING_FOOD: "Menunggu",
  REQUESTING_BILL: "Minta Bill",
  RESERVED: "Reserved",
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
}

export function TableGrid({ tables }: TableGridProps) {
  const [qrDialog, setQrDialog] = useState<TableData | null>(null);

  const handleDownloadQR = (table: TableData) => {
    const link = document.createElement("a");
    link.href = `/api/qr/${table.id}`;
    link.download = `qr-meja-${table.number}.png`;
    link.click();
  };

  return (
    <>
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
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrDialog(table);
                    }}
                  >
                    <QrCode className="mr-1 h-3 w-3" />
                    QR Code
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
    </>
  );
}
