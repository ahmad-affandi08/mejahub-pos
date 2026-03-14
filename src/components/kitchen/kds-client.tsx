"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKDSSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import {
  ChefHat,
  Coffee,
  Clock,
  Flame,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { updateOrderItemStatus } from "@/actions/order";

interface KDSOrderItem {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  station: string;
  cookingStartAt: string | null;
  createdAt: string;
  product: { id: string; name: string };
  variant: { id: string; name: string } | null;
  modifiers: Array<{ id: string; name: string; price: number | string }>;
  order: {
    id: string;
    orderNumber: string;
    type: string;
    tableId: string | null;
    table: { number: number; name: string | null } | null;
    createdAt: string;
  };
}

interface KDSClientProps {
  orderItems: KDSOrderItem[];
  branchId: string;
}

const statusFlow: Record<string, string> = {
  PENDING: "COOKING",
  COOKING: "READY",
  READY: "SERVED",
};

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "Menunggu",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  COOKING: {
    label: "Dimasak",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    icon: Flame,
  },
  READY: {
    label: "Siap",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
};

export function KDSClient({ orderItems, branchId }: KDSClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [station, setStation] = useState<string>("ALL");
  const { on } = useKDSSocket(branchId);

  useEffect(() => {
    const unsubscribers = [
      on("new-order", () => router.refresh()),
      on("order-updated", () => router.refresh()),
      on("order-item-status", () => router.refresh()),
      on("table-status-change", () => router.refresh()),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [on, router]);

  // Filter by station
  const filteredItems =
    station === "ALL"
      ? orderItems
      : orderItems.filter((item) => item.station === station);

  // Group by status
  const pending = filteredItems.filter((i) => i.status === "PENDING");
  const cooking = filteredItems.filter((i) => i.status === "COOKING");
  const ready = filteredItems.filter((i) => i.status === "READY");

  function handleBump(itemId: string, currentStatus: string) {
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    startTransition(async () => {
      const result = await updateOrderItemStatus({
        orderItemId: itemId,
        status: nextStatus,
      });
      if (result.success) {
        toast.success(`Status diupdate ke ${nextStatus}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function getElapsedTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "< 1m";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  function renderItemCard(item: KDSOrderItem) {
    const config = statusConfig[item.status];
    const Icon = config?.icon || Clock;
    const nextStatus = statusFlow[item.status];
    const elapsed = getElapsedTime(item.cookingStartAt || item.createdAt);
    const isUrgent =
      item.status === "PENDING" &&
      Date.now() - new Date(item.createdAt).getTime() > 15 * 60 * 1000; // >15min

    return (
      <Card
        key={item.id}
        className={`${config?.bgColor || ""} ${isUrgent ? "ring-2 ring-red-500 animate-pulse" : ""}`}
      >
        <CardContent className="p-4 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm">{item.order.orderNumber}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {item.order.table ? (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {item.order.table.number}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Takeaway
                  </Badge>
                )}
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {elapsed}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${config?.color || ""} text-[10px]`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {config?.label}
            </Badge>
          </div>

          {/* Item info */}
          <div>
            <p className="font-medium">
              {item.quantity}x {item.product.name}
            </p>
            {item.variant && (
              <p className="text-xs text-muted-foreground">
                {item.variant.name}
              </p>
            )}
            {item.modifiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {item.modifiers.map((m) => m.name).join(", ")}
              </p>
            )}
            {item.notes && (
              <p className="text-xs font-medium text-red-600 mt-1">
                ⚠️ {item.notes}
              </p>
            )}
          </div>

          {/* Bump button */}
          {nextStatus && (
            <Button
              size="sm"
              className="w-full"
              variant={item.status === "READY" ? "default" : "outline"}
              onClick={() => handleBump(item.id, item.status)}
              disabled={isPending}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              {nextStatus === "COOKING"
                ? "Mulai Masak"
                : nextStatus === "READY"
                ? "Siap Diambil"
                : "Sudah Disajikan"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          <p className="text-muted-foreground">
            {filteredItems.length} item aktif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={station}
            onValueChange={setStation}
          >
            <TabsList>
              <TabsTrigger value="ALL">
                Semua ({orderItems.length})
              </TabsTrigger>
              <TabsTrigger value="KITCHEN" className="gap-1">
                <ChefHat className="h-4 w-4" />
                Dapur (
                {orderItems.filter((i) => i.station === "KITCHEN").length})
              </TabsTrigger>
              <TabsTrigger value="BAR" className="gap-1">
                <Coffee className="h-4 w-4" />
                Bar ({orderItems.filter((i) => i.station === "BAR").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KDS Columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* PENDING */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold">
              Menunggu ({pending.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pending.map(renderItemCard)}
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada item menunggu
              </p>
            )}
          </div>
        </div>

        {/* COOKING */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-600" />
            <h2 className="font-semibold">
              Dimasak ({cooking.length})
            </h2>
          </div>
          <div className="space-y-3">
            {cooking.map(renderItemCard)}
            {cooking.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada item dimasak
              </p>
            )}
          </div>
        </div>

        {/* READY */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold">
              Siap ({ready.length})
            </h2>
          </div>
          <div className="space-y-3">
            {ready.map(renderItemCard)}
            {ready.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada item siap
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
