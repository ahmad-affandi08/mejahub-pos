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
  MapPin,
  User,
  Hash,
  MessageCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  cancelOrder,
  mergeTableOrders,
  transferTable,
  voidOrderItem,
} from "@/actions/order";
import { processPayment, processSplitBill, refundPayment } from "@/actions/payment";
import { sendOrderReceiptViaWhatsAppService } from "@/actions/whatsapp-service";
import {
  calculateChange,
  suggestCashDenominations,
} from "@/lib/calculations";
import Link from "next/link";

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Tunai" },
  { value: "QRIS", label: "QRIS" },
  { value: "DEBIT_CARD", label: "Debit" },
  { value: "CREDIT_CARD", label: "Kredit" },
  { value: "E_WALLET", label: "E-Wallet" },
  { value: "TRANSFER", label: "Transfer" },
] as const;

type SplitPaymentInput = {
  method: string;
  amount: string;
  receivedAmount: string;
  reference: string;
};

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
  tables: Array<{
    id: string;
    number: number;
    name: string | null;
    status: string;
  }>;
  mergeTargets: Array<{
    id: string;
    orderNumber: string;
    table: {
      id: string;
      number: number;
      name: string | null;
    } | null;
  }>;
  permissions: {
    canProcessPayment: boolean;
    canTransferTable: boolean;
    canMergeTable: boolean;
    canRefundPayment: boolean;
  };
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
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

export function OrderDetail({
  order,
  tables,
  mergeTargets,
  permissions,
}: OrderDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payCustomerName, setPayCustomerName] = useState(order.customerName || "");
  const [payCustomerPhone, setPayCustomerPhone] = useState(order.customerPhone || "");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [targetMergeOrderId, setTargetMergeOrderId] = useState("");
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentInput[]>([
    { method: "CASH", amount: "", receivedAmount: "", reference: "" },
  ]);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const totalAmount = Number(order.totalAmount);
  const received = parseFloat(receivedAmount) || 0;
  const change = payMethod === "CASH" ? calculateChange(totalAmount, received) : 0;
  const cashSuggestions = suggestCashDenominations(totalAmount);
  const availableTransferTables = tables.filter(
    (table) => table.status === "AVAILABLE" && table.id !== order.tableId
  );
  const availableMergeTargets = mergeTargets.filter(
    (target) => target.table && target.table.id !== order.tableId
  );
  const splitTotal = splitPayments.reduce(
    (sum, payment) => sum + (parseFloat(payment.amount) || 0),
    0
  );
  const splitRemaining = totalAmount - splitTotal;
  const splitValid =
    splitPayments.length > 0 &&
    splitTotal >= totalAmount &&
    splitPayments.every((payment) => {
      const amount = parseFloat(payment.amount) || 0;
      const receivedCash = parseFloat(payment.receivedAmount) || 0;
      if (amount <= 0) return false;
      if (payment.method === "CASH") return receivedCash >= amount;
      return true;
    });

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
    const customerName = payCustomerName.trim();
    const customerPhone = payCustomerPhone.trim();
    const normalizedPhone = customerPhone.replace(/\D/g, "");

    if (customerName.length < 2 || normalizedPhone.length < 9) {
      toast.error("Nama dan nomor WhatsApp pelanggan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await processPayment({
        orderId: order.id,
        method: payMethod,
        amount: totalAmount,
        receivedAmount: payMethod === "CASH" ? received : undefined,
        reference: payRef || undefined,
        customerName,
        customerPhone,
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

  function addSplitPaymentRow() {
    setSplitPayments((prev) => [
      ...prev,
      { method: "CASH", amount: "", receivedAmount: "", reference: "" },
    ]);
  }

  function removeSplitPaymentRow(index: number) {
    setSplitPayments((prev) => prev.filter((_, idx) => idx !== index));
  }

  function updateSplitPayment(index: number, patch: Partial<SplitPaymentInput>) {
    setSplitPayments((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  }

  function handleSplitBill() {
    if (!splitValid) {
      toast.error("Pastikan semua nominal valid dan total mencukupi tagihan.");
      return;
    }

    startTransition(async () => {
      const result = await processSplitBill({
        orderId: order.id,
        payments: splitPayments.map((payment) => ({
          method: payment.method,
          amount: parseFloat(payment.amount) || 0,
          receivedAmount:
            payment.method === "CASH"
              ? parseFloat(payment.receivedAmount) || 0
              : undefined,
          reference:
            payment.method !== "CASH" && payment.reference.trim()
              ? payment.reference.trim()
              : undefined,
        })),
      });

      if (result.success) {
        toast.success("Split bill berhasil diproses.");
        setSplitDialogOpen(false);
        setSplitPayments([
          { method: "CASH", amount: "", receivedAmount: "", reference: "" },
        ]);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleTransferTable() {
    if (!targetTableId) {
      toast.error("Pilih meja tujuan terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const result = await transferTable({
        orderId: order.id,
        newTableId: targetTableId,
      });

      if (result.success) {
        toast.success("Meja berhasil dipindahkan.");
        setTransferDialogOpen(false);
        setTargetTableId("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function openRefund(paymentId: string) {
    setRefundPaymentId(paymentId);
    setRefundReason("");
    setRefundDialogOpen(true);
  }

  function handleMergeTable() {
    if (!targetMergeOrderId) {
      toast.error("Pilih order tujuan terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const result = await mergeTableOrders({
        sourceOrderId: order.id,
        targetOrderId: targetMergeOrderId,
      });

      if (result.success) {
        toast.success("Meja berhasil digabungkan.");
        setMergeDialogOpen(false);
        setTargetMergeOrderId("");
        router.push(`/dashboard/orders/${result.data.targetOrderId}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRefund() {
    if (!refundPaymentId) return;
    if (!refundReason.trim()) {
      toast.error("Alasan refund wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await refundPayment(refundPaymentId, refundReason.trim());

      if (result.success) {
        toast.success("Refund berhasil diproses.");
        setRefundDialogOpen(false);
        setRefundPaymentId("");
        setRefundReason("");
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
            {permissions.canTransferTable && order.table && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferDialogOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Pindah Meja
              </Button>
            )}
            {permissions.canMergeTable && order.table && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeDialogOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Gabung Meja
              </Button>
            )}
            {permissions.canProcessPayment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSplitDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-1" /> Split Bill
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" /> Batalkan
            </Button>
            <Button
              size="sm"
              onClick={() => setPayDialogOpen(true)}
              disabled={!permissions.canProcessPayment}
            >
              <CreditCard className="h-4 w-4 mr-1" /> Bayar
            </Button>
          </div>
        )}

        {order.status === "PAID" && permissions.canProcessPayment && (
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => {
              startTransition(async () => {
                const firstAttempt = await sendOrderReceiptViaWhatsAppService({
                  orderId: order.id,
                });

                if (firstAttempt.success) {
                  toast.success("Struk berhasil dikirim via WhatsApp service.");
                  return;
                }

                const needsPhoneInput = firstAttempt.error
                  .toLowerCase()
                  .includes("tidak memiliki nomor whatsapp pelanggan");

                if (!needsPhoneInput) {
                  toast.error(firstAttempt.error);
                  return;
                }

                const prompted = window.prompt(
                  "Nomor WhatsApp pelanggan belum ada. Masukkan nomor (contoh 08xxxx atau 62xxxx):"
                );

                if (!prompted?.trim()) {
                  toast.error("Nomor WhatsApp wajib diisi untuk kirim struk.");
                  return;
                }

                const secondAttempt = await sendOrderReceiptViaWhatsAppService({
                  orderId: order.id,
                  phone: prompted.trim(),
                });

                if (secondAttempt.success) {
                  toast.success("Struk berhasil dikirim via WhatsApp service.");
                } else {
                  toast.error(secondAttempt.error);
                }
              });
            }}
            disabled={isPending}
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
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span>WhatsApp: {order.customerPhone}</span>
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
                    {permissions.canRefundPayment && payment.status === "COMPLETED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/5"
                        onClick={() => openRefund(payment.id)}
                        disabled={isPending}
                      >
                        Refund
                      </Button>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Nama Pelanggan *</p>
                <Input
                  value={payCustomerName}
                  onChange={(e) => setPayCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">No. WhatsApp *</p>
                <Input
                  value={payCustomerPhone}
                  onChange={(e) => setPayCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <Select value={payMethod} onValueChange={(v) => v && setPayMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
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

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindah Meja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {order.table && (
              <p className="text-sm text-muted-foreground">
                Meja saat ini: #{order.table.number}
                {order.table.name ? ` — ${order.table.name}` : ""}
              </p>
            )}

            <Select
              value={targetTableId}
              onValueChange={(value) => setTargetTableId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih meja tujuan" />
              </SelectTrigger>
              <SelectContent>
                {availableTransferTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Meja #{table.number}
                    {table.name ? ` — ${table.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableTransferTables.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tidak ada meja kosong yang tersedia saat ini.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleTransferTable}
              disabled={isPending || !targetTableId || availableTransferTables.length === 0}
            >
              {isPending ? "Memproses..." : "Pindahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gabung Meja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih order tujuan. Item aktif dari {order.orderNumber} akan dipindahkan ke
              order tersebut.
            </p>

            <Select
              value={targetMergeOrderId}
              onValueChange={(value) => setTargetMergeOrderId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih order tujuan" />
              </SelectTrigger>
              <SelectContent>
                {availableMergeTargets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.orderNumber} • Meja #{target.table?.number}
                    {target.table?.name ? ` — ${target.table.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableMergeTargets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Belum ada order OPEN di meja lain yang bisa dijadikan tujuan merge.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleMergeTable}
              disabled={isPending || !targetMergeOrderId || availableMergeTargets.length === 0}
            >
              {isPending ? "Memproses..." : "Gabungkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Tagihan</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Total Input</span>
                <span className="font-semibold">{formatCurrency(splitTotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Sisa</span>
                <span className={`font-semibold ${splitRemaining > 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatCurrency(Math.abs(splitRemaining))}
                </span>
              </div>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {splitPayments.map((payment, index) => {
                const amount = parseFloat(payment.amount) || 0;
                const receivedCash = parseFloat(payment.receivedAmount) || 0;
                const changeCash =
                  payment.method === "CASH"
                    ? calculateChange(amount, receivedCash)
                    : 0;

                return (
                  <div key={`split-${index}`} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Pembayaran {index + 1}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => removeSplitPaymentRow(index)}
                        disabled={splitPayments.length <= 1 || isPending}
                      >
                        Hapus
                      </Button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <Select
                        value={payment.method}
                        onValueChange={(value) =>
                          updateSplitPayment(index, {
                            method: value ?? "CASH",
                            receivedAmount: "",
                            reference: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(event) =>
                          updateSplitPayment(index, { amount: event.target.value })
                        }
                        placeholder="Nominal pembayaran"
                        className="text-right"
                      />
                    </div>

                    {payment.method === "CASH" ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={payment.receivedAmount}
                          onChange={(event) =>
                            updateSplitPayment(index, {
                              receivedAmount: event.target.value,
                            })
                          }
                          placeholder="Uang diterima"
                          className="text-right"
                        />
                        {receivedCash > 0 && (
                          <p
                            className={`text-xs text-right ${
                              receivedCash >= amount ? "text-green-600" : "text-destructive"
                            }`}
                          >
                            {receivedCash >= amount
                              ? `Kembalian: ${formatCurrency(changeCash)}`
                              : `Kurang: ${formatCurrency(amount - receivedCash)}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={payment.reference}
                        onChange={(event) =>
                          updateSplitPayment(index, {
                            reference: event.target.value,
                          })
                        }
                        placeholder="Referensi (opsional)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="justify-between gap-2 sm:justify-between">
            <Button variant="outline" onClick={addSplitPaymentRow} disabled={isPending}>
              Tambah Metode
            </Button>
            <Button onClick={handleSplitBill} disabled={isPending || !splitValid}>
              {isPending ? "Memproses..." : "Proses Split Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Refund akan membuka kembali pesanan ini untuk koreksi pembayaran.
            </p>
            <div>
              <label className="text-sm font-medium">Alasan Refund</label>
              <Input
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                placeholder="Contoh: salah input nominal"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRefund} disabled={isPending}>
              {isPending ? "Memproses..." : "Konfirmasi Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
