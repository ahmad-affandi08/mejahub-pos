"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, Eye, MapPin, User } from "lucide-react";
import type { OrderWithRelations } from "./pos-client";
import Link from "next/link";

interface OpenOrdersListProps {
  orders: OrderWithRelations[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  VOID: "bg-gray-100 text-gray-800",
};

const itemStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  SERVED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OpenOrdersList({ orders }: OpenOrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">Tidak ada pesanan aktif</p>
        <p className="text-sm">Buat pesanan baru dari tab &quot;Order Baru&quot;</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  {order.orderNumber}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(new Date(order.createdAt))}
                </p>
              </div>
              <Badge className={statusColors[order.status]}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {order.table && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Meja {order.table.number}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {order.user.name}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {order.type === "DINE_IN" ? "Dine In" : "Takeaway"}
              </Badge>
            </div>

            {/* Items summary */}
            <div className="space-y-1">
              {order.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground">
                      {item.quantity}x
                    </span>
                    <span className="truncate">{item.product.name}</span>
                    <Badge
                      className={`text-[9px] ${itemStatusColors[item.status]}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {order.items.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{order.items.length - 4} item lainnya
                </p>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">
                {formatCurrency(Number(order.totalAmount))}
              </span>
              <Link href={`/dashboard/orders/${order.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Detail
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
