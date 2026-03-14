"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { processPayment, saveOrderCustomerInfo } from "@/actions/payment";
import {
  calculateChange,
  suggestCashDenominations,
} from "@/lib/calculations";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalAmount: number;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai", icon: Banknote },
  { value: "QRIS", label: "QRIS", icon: QrCode },
  { value: "DEBIT_CARD", label: "Debit", icon: CreditCard },
  { value: "CREDIT_CARD", label: "Kredit", icon: CreditCard },
  { value: "E_WALLET", label: "E-Wallet", icon: Wallet },
  { value: "TRANSFER", label: "Transfer", icon: ArrowRightLeft },
] as const;

export function PaymentModal({
  open,
  onOpenChange,
  orderId,
  totalAmount,
  initialCustomerName,
  initialCustomerPhone,
}: PaymentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState("CASH");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [reference, setReference] = useState("");
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone || "");

  const received = parseFloat(receivedAmount) || 0;
  const change = method === "CASH" ? calculateChange(totalAmount, received) : 0;
  const normalizedPhone = customerPhone.replace(/\D/g, "");
  const isCustomerValid = customerName.trim().length >= 2 && normalizedPhone.length >= 9;
  const isValid =
    (method === "CASH" ? received >= totalAmount : true) && isCustomerValid;

  const cashSuggestions = suggestCashDenominations(totalAmount);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCustomerName(initialCustomerName || "");
      setCustomerPhone(initialCustomerPhone || "");
      setMethod("CASH");
      setReceivedAmount("");
      setReference("");
    }

    onOpenChange(nextOpen);
  }

  function handlePay() {
    if (!isCustomerValid) {
      toast.error("Nama dan nomor WhatsApp pelanggan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result = await processPayment({
        orderId,
        method,
        amount: totalAmount,
        receivedAmount: method === "CASH" ? received : undefined,
        reference: reference || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });

      if (result.success) {
        toast.success("Pembayaran berhasil!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePayLater() {
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const hasAnyCustomerInput = trimmedName.length > 0 || trimmedPhone.length > 0;

    if (!hasAnyCustomerInput) {
      onOpenChange(false);
      return;
    }

    if (!isCustomerValid) {
      toast.error("Lengkapi nama dan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const result = await saveOrderCustomerInfo({
        orderId,
        customerName: trimmedName,
        customerPhone: trimmedPhone,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Data pelanggan tersimpan.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="text-center bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Tagihan</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-2">Nama Pelanggan *</p>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">No. WhatsApp *</p>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <Button
                    key={pm.value}
                    variant={method === pm.value ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col h-auto py-3 gap-1"
                    onClick={() => {
                      setMethod(pm.value);
                      setReceivedAmount("");
                      setReference("");
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{pm.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Cash Input */}
          {method === "CASH" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Uang Diterima</p>
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="Masukkan nominal"
                  className="text-lg font-medium text-right"
                  autoFocus
                />
              </div>

              {/* Quick denomination buttons */}
              <div className="flex flex-wrap gap-2">
                {cashSuggestions.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setReceivedAmount(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              {/* Change */}
              {received > 0 && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Kembalian</p>
                  <p
                    className={`text-2xl font-bold ${
                      received >= totalAmount
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {received >= totalAmount
                      ? formatCurrency(change)
                      : `Kurang ${formatCurrency(totalAmount - received)}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Non-cash reference */}
          {method !== "CASH" && (
            <div>
              <p className="text-sm font-medium mb-2">Referensi (opsional)</p>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  method === "QRIS"
                    ? "ID Transaksi QRIS"
                    : "Nomor referensi"
                }
              />
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handlePayLater}
            disabled={isPending}
            className="flex-1"
          >
            Bayar Nanti
          </Button>
          <Button
            onClick={handlePay}
            disabled={isPending || !isValid}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            {isPending ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
