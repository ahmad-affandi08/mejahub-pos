"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveQrOrder, rejectQrOrder } from "@/actions/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, QrCode, User, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PendingQrOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  customerName: string | null;
  table: { id: string; number: number; name: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    product: { id: string; name: string };
  }>;
}

export function PendingQROrders({ orders }: { orders: PendingQrOrder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (orderId: string) => {
    startTransition(async () => {
      const result = await approveQrOrder({ orderId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pesanan QR disetujui dan diteruskan ke dapur.");
      router.refresh();
    });
  };

  const handleReject = (orderId: string) => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error("Alasan penolakan minimal 3 karakter.");
      return;
    }

    startTransition(async () => {
      const result = await rejectQrOrder({ orderId, reason });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pesanan QR ditolak.");
      setRejectingOrderId(null);
      setRejectReason("");
      router.refresh();
    });
  };

  if (orders.length === 0) return null;

  return (
    <Card className="border-yellow-300 bg-yellow-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-5 w-5 text-yellow-700" />
          Menunggu Approval QR ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <Card key={order.id} className="border-yellow-200">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(new Date(order.createdAt))}
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                  QR Pending
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {order.customerName && (
                  <p className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {order.customerName}
                  </p>
                )}
                {order.table && (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {order.table.number}
                    {order.table.name ? ` - ${order.table.name}` : ""}
                  </p>
                )}
                <p>{order.items.length} item • {formatCurrency(Number(order.totalAmount))}</p>
              </div>

              <div className="space-y-1">
                {order.items.slice(0, 3).map((item) => (
                  <p key={item.id} className="text-xs">
                    {item.quantity}x {item.product.name}
                  </p>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{order.items.length - 3} item lainnya</p>
                )}
              </div>

              {rejectingOrderId === order.id ? (
                <div className="space-y-2">
                  <Input
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Alasan penolakan"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => handleReject(order.id)}
                    >
                      Simpan Tolak
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRejectingOrderId(null);
                        setRejectReason("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => handleApprove(order.id)}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => setRejectingOrderId(order.id)}
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Tolak
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
