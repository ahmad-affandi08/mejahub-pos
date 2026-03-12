"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  CreditCard,
  XCircle,
  Trash2,
  ArrowRightLeft,
  Clock,
  MapPin,
  User,
  Hash,
  MessageCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cancelOrder, voidOrderItem } from "@/actions/order";
import { processPayment } from "@/actions/payment";
import {
  calculateChange,
  suggestCashDenominations,
} from "@/lib/calculations";
import {
  buildWhatsAppReceiptUrl,
  getPaymentMethodLabel,
} from "@/lib/whatsapp";
import Link from "next/link";

interface OrderDetailProps {
  order: {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    subtotal: number | string;
    taxAmount: number | string;
    taxRate: number | string;
    serviceAmount: number | string;
    serviceRate: number | string;
    discountAmount: number | string;
    totalAmount: number | string;
    notes: string | null;
    customerName: string | null;
    customerPhone: string | null;
    tableId: string | null;
    createdAt: string;
    table: { id: string; number: number; name: string | null } | null;
    branch: { id: string; name: string } | null;
    user: { id: string; name: string; role: string };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number | string;
      subtotal: number | string;
      notes: string | null;
      status: string;
      station: string;
      product: { id: string; name: string };
      variant: { id: string; name: string } | null;
      modifiers: Array<{
        id: string;
        name: string;
        price: number | string;
      }>;
    }>;
    payments: Array<{
      id: string;
      method: string;
      status: string;
      amount: number | string;
      receivedAmount: number | string;
      changeAmount: number | string;
      reference: string | null;
      createdAt: string;
    }>;
  };
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
  CANCELLED: "bg-red-100 text-red-800 line-through",
};

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [payRef, setPayRef] = useState("");

  const totalAmount = Number(order.totalAmount);
  const received = parseFloat(receivedAmount) || 0;
  const change = payMethod === "CASH" ? calculateChange(totalAmount, received) : 0;
  const cashSuggestions = suggestCashDenominations(totalAmount);

  function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    startTransition(async () => {
      const result = await cancelOrder({
        orderId: order.id,
        reason: cancelReason,
      });
      if (result.success) {
        toast.success("Pesanan dibatalkan");
        setCancelDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleVoidItem(itemId: string, productName: string) {
    const reason = prompt(`Alasan void "${productName}":`);
    if (!reason) return;

    startTransition(async () => {
      const result = await voidOrderItem(itemId, reason);
      if (result.success) {
        toast.success(`${productName} di-void`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePay() {
    startTransition(async () => {
      const result = await processPayment({
        orderId: order.id,
        method: payMethod,
        amount: totalAmount,
        receivedAmount: payMethod === "CASH" ? received : undefined,
        reference: payRef || undefined,
      });
      if (result.success) {
        toast.success("Pembayaran berhasil!");
        setPayDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {order.orderNumber}
              <Badge className={statusColors[order.status]}>
                {order.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(order.createdAt))}
            </p>
          </div>
        </div>

        {order.status === "OPEN" && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" /> Batalkan
            </Button>
            <Button size="sm" onClick={() => setPayDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-1" /> Bayar
            </Button>
          </div>
        )}

        {order.status === "PAID" && order.customerPhone && (
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => {
              const lastPayment = order.payments[order.payments.length - 1];
              const url = buildWhatsAppReceiptUrl(order.customerPhone!, {
                orderNumber: order.orderNumber,
                branchName: order.branch?.name || "MejaHub",
                tableName: order.table
                  ? `#${order.table.number}${order.table.name ? ` - ${order.table.name}` : ""}`
                  : "Takeaway",
                customerName: order.customerName || "Pelanggan",
                items: order.items
                  .filter((i) => i.status !== "CANCELLED")
                  .map((i) => ({
                    name: i.product.name,
                    variantName: i.variant?.name,
                    quantity: i.quantity,
                    subtotal: Number(i.subtotal),
                    modifiers: i.modifiers.map((m) => ({
                      name: m.name,
                      price: Number(m.price),
                    })),
                  })),
                subtotal: Number(order.subtotal),
                taxRate: Number(order.taxRate),
                taxAmount: Number(order.taxAmount),
                serviceRate: Number(order.serviceRate),
                serviceAmount: Number(order.serviceAmount),
                discountAmount: Number(order.discountAmount),
                totalAmount: Number(order.totalAmount),
                paymentMethod: lastPayment
                  ? getPaymentMethodLabel(lastPayment.method)
                  : undefined,
                paidAmount: lastPayment
                  ? Number(lastPayment.receivedAmount)
                  : undefined,
                changeAmount: lastPayment
                  ? Number(lastPayment.changeAmount)
                  : undefined,
                createdAt: new Date(order.createdAt),
              });
              window.open(url, "_blank");
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" /> Kirim Struk WA
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>{order.type === "DINE_IN" ? "Dine In" : "Takeaway"}</span>
            </div>
            {order.table && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  Meja {order.table.number}
                  {order.table.name ? ` — ${order.table.name}` : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {order.user.name}{" "}
                <Badge variant="outline" className="text-[10px]">
                  {order.user.role}
                </Badge>
              </span>
            </div>
            {order.customerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Pelanggan: {order.customerName}</span>
              </div>
            )}
            {order.notes && (
              <p className="text-xs text-muted-foreground italic">
                📝 {order.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>-{formatCurrency(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Pajak ({Number(order.taxRate)}%)
              </span>
              <span>{formatCurrency(Number(order.taxAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Service ({Number(order.serviceRate)}%)
              </span>
              <span>{formatCurrency(Number(order.serviceAmount))}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pembayaran</p>
            ) : (
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <Badge variant="outline">{payment.method}</Badge>
                      <Badge
                        className={
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "REFUNDED"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah</span>
                      <span>{formatCurrency(Number(payment.amount))}</span>
                    </div>
                    {payment.method === "CASH" && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Diterima</span>
                          <span>
                            {formatCurrency(Number(payment.receivedAmount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Kembalian</span>
                          <span>
                            {formatCurrency(Number(payment.changeAmount))}
                          </span>
                        </div>
                      </>
                    )}
                    {payment.reference && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Item Pesanan ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {item.quantity}x {item.product.name}
                    </span>
                    {item.variant && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.variant.name}
                      </Badge>
                    )}
                    <Badge
                      className={`text-[10px] ${itemStatusColors[item.status]}`}
                    >
                      {item.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {item.station}
                    </Badge>
                  </div>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.modifiers.map((m) => m.name).join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      📝 {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium">
                    {formatCurrency(Number(item.subtotal))}
                  </span>
                  {order.status === "OPEN" && item.status !== "CANCELLED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() =>
                        handleVoidItem(item.id, item.product.name)
                      }
                      disabled={isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Alasan Pembatalan</label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Masukkan alasan..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? "Memproses..." : "Konfirmasi Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Bayar — {formatCurrency(totalAmount)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={payMethod} onValueChange={(v) => v && setPayMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Tunai</SelectItem>
                <SelectItem value="QRIS">QRIS</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit</SelectItem>
                <SelectItem value="CREDIT_CARD">Kredit</SelectItem>
                <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>

            {payMethod === "CASH" && (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="Uang diterima"
                  className="text-right text-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {cashSuggestions.map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setReceivedAmount(amt.toString())}
                    >
                      {formatCurrency(amt)}
                    </Button>
                  ))}
                </div>
                {received > 0 && (
                  <p className={`text-center font-bold ${received >= totalAmount ? "text-green-600" : "text-destructive"}`}>
                    {received >= totalAmount
                      ? `Kembalian: ${formatCurrency(change)}`
                      : `Kurang: ${formatCurrency(totalAmount - received)}`}
                  </p>
                )}
              </div>
            )}

            {payMethod !== "CASH" && (
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Referensi (opsional)"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handlePay}
              disabled={isPending || (payMethod === "CASH" && received < totalAmount)}
              className="w-full"
            >
              {isPending ? "Memproses..." : "Bayar Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
