"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, Eye, MapPin, Search, User } from "lucide-react";
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

export function OrderHistoryList({
  orders,
  initialFilters,
  pagination,
}: OpenOrdersListProps & {
  initialFilters: {
    orderNumber: string;
    customerName: string;
    date: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orderQuery, setOrderQuery] = useState(initialFilters.orderNumber);
  const [customerQuery, setCustomerQuery] = useState(initialFilters.customerName);
  const [dateQuery, setDateQuery] = useState(initialFilters.date);
  const hasMountedRef = useRef(false);

  const buildHistoryQuery = useCallback((
    values: { order: string; customer: string; date: string },
    nextPage: number
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("htab", "history-orders");

    const trimmedOrder = values.order.trim();
    const trimmedCustomer = values.customer.trim();

    if (trimmedOrder) params.set("hOrder", trimmedOrder);
    else params.delete("hOrder");

    if (trimmedCustomer) params.set("hCustomer", trimmedCustomer);
    else params.delete("hCustomer");

    if (values.date) params.set("hDate", values.date);
    else params.delete("hDate");

    params.set("hPage", String(Math.max(1, nextPage)));
    return params;
  }, [searchParams]);

  const navigateHistory = useCallback((
    values: { order: string; customer: string; date: string },
    nextPage: number,
    mode: "push" | "replace"
  ) => {
    const params = buildHistoryQuery(values, nextPage);
    const nextQueryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString === currentQueryString) {
      return;
    }

    const targetUrl = `${pathname}?${nextQueryString}`;
    if (mode === "replace") {
      router.replace(targetUrl, { scroll: false });
      return;
    }

    router.push(targetUrl, { scroll: false });
  }, [buildHistoryQuery, pathname, router, searchParams]);

  function pushQuery(nextPage: number) {
    navigateHistory(
      {
        order: orderQuery,
        customer: customerQuery,
        date: dateQuery,
      },
      nextPage,
      "push"
    );
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const debounceTimer = setTimeout(() => {
      navigateHistory(
        {
          order: orderQuery,
          customer: customerQuery,
          date: dateQuery,
        },
        1,
        "replace"
      );
    }, 450);

    return () => clearTimeout(debounceTimer);
  }, [orderQuery, customerQuery, dateQuery, navigateHistory]);

  const fromItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const toItem = pagination.total === 0
    ? 0
    : Math.min((pagination.page - 1) * pagination.pageSize + orders.length, pagination.total);

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              placeholder="Cari no order"
              className="pl-9"
            />
          </div>
          <Input
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Cari nama pelanggan"
          />
          <Input
            type="date"
            value={dateQuery}
            onChange={(event) => setDateQuery(event.target.value)}
          />
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Clock className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">Belum ada history pesanan selesai</p>
          <p className="text-sm">History akan muncul saat pesanan sudah dibayar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="Cari no order"
            className="pl-9"
          />
        </div>
        <Input
          value={customerQuery}
          onChange={(event) => setCustomerQuery(event.target.value)}
          placeholder="Cari nama pelanggan"
        />
        <Input
          type="date"
          value={dateQuery}
          onChange={(event) => setDateQuery(event.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(new Date(order.createdAt))}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status] ?? "bg-muted text-foreground"}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {order.table && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Meja {order.table.number}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.customerName || "-"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {order.type === "DINE_IN" ? "Dine In" : "Takeaway"}
                  </Badge>
                </div>

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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground">
          Menampilkan {fromItem}-{toItem} dari {pagination.total} order
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => pushQuery(pagination.page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-muted-foreground">
            Halaman {pagination.page} / {Math.max(1, pagination.totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => pushQuery(pagination.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
