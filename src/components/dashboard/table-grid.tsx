"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
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
  return (
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
