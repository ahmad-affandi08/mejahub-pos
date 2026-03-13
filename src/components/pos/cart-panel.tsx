"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ShoppingCart,
  Percent,
  Tag,
  User,
  Phone,
  StickyNote,
  UtensilsCrossed,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createOrder } from "@/actions/order";
import { PaymentModal } from "./payment-modal";
import type { TableData } from "./pos-client";
import type { CreateOrderInput } from "@/lib/validations/order";

interface CartPanelProps {
  tables: TableData[];
}

const orderTypeLabels: Record<"DINE_IN" | "TAKEAWAY", string> = {
  DINE_IN: "Makan di Tempat",
  TAKEAWAY: "Bawa Pulang",
};

export function CartPanel({ tables }: CartPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderTotal, setCreatedOrderTotal] = useState(0);

  // Discount form state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");

  const {
    items,
    tableId,
    orderType,
    customerName,
    customerPhone,
    notes,
    discount,
    removeItem,
    updateQuantity,
    setTableId,
    setOrderType,
    setCustomerName,
    setCustomerPhone,
    setNotes,
    setDiscount,
    clearCart,
    getItemTotal,
    getOrderCalculation,
    getTotalItems,
  } = useCartStore();

  const calc = getOrderCalculation();
  const totalItems = getTotalItems();
  const availableTables = tables.filter(
    (t) => t.status === "AVAILABLE" || t.id === tableId
  );

  function handleApplyDiscount() {
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setDiscount(null);
      setDiscountDialogOpen(false);
      return;
    }
    setDiscount({ type: discountType, value: val });
    setDiscountDialogOpen(false);
    toast.success(
      `Diskon ${discountType === "percentage" ? `${val}%` : formatCurrency(val)} diterapkan`
    );
  }

  function handleSubmitOrder() {
    if (items.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }
    if (orderType === "DINE_IN" && !tableId) {
      toast.error("Pilih meja untuk dine-in");
      return;
    }

    startTransition(async () => {
      const input: CreateOrderInput = {
        type: orderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
          notes: item.notes,
          modifiers: item.modifiers.map((m) => ({
            modifierId: m.modifierId,
            name: m.name,
            price: m.price,
          })),
        })),
        discountType: discount?.type,
        discountValue: discount?.value,
      };

      const result = await createOrder(input);

      if (result.success) {
        toast.success(`Order ${result.data.orderNumber} berhasil dibuat!`);
        setCreatedOrderId(result.data.id);
        setCreatedOrderTotal(Number(result.data.totalAmount));
        setPaymentModalOpen(true);
        clearCart();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/30">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Keranjang
            {totalItems > 0 && (
              <Badge variant="default" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </h2>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Kosongkan
            </Button>
          )}
        </div>

        {/* Order Type + Table Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderType}
            onValueChange={(v) => setOrderType(v as "DINE_IN" | "TAKEAWAY")}
          >
            <SelectTrigger className="h-9 text-xs">
              <span className="line-clamp-1 flex flex-1 items-center text-left">
                {orderTypeLabels[orderType]}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DINE_IN">Makan di Tempat</SelectItem>
              <SelectItem value="TAKEAWAY">Bawa Pulang</SelectItem>
            </SelectContent>
          </Select>

          {orderType === "DINE_IN" ? (
            <Select
              value={tableId || ""}
              onValueChange={(v) => {
                const table = tables.find((t) => t.id === v);
                setTableId(v, table ? `Meja ${table.number}` : null);
              }}
            >
              <SelectTrigger className="h-9 text-xs data-placeholder:text-foreground">
                <SelectValue placeholder="Pilih Meja" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Meja {table.number}
                    {table.name ? ` — ${table.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => setCustomerDialogOpen(true)}
            >
              <User className="h-3 w-3 mr-1" />
              {customerName || "Info Pelanggan"}
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="min-h-0 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Keranjang kosong</p>
            <p className="text-xs">Klik produk untuk menambahkan</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item, index) => (
              <Card key={index} className="shadow-none">
                <CardContent className="p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {item.image ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground">
                            {item.variantName}
                          </p>
                        )}
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs italic text-muted-foreground">
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateQuantity(index, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateQuantity(index, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-medium text-sm">
                      {formatCurrency(getItemTotal(item))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer: Totals & Actions */}
      {items.length > 0 && (
        <div className="border-t p-4 space-y-3">
          {/* Action buttons row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                setDiscountValue(discount?.value?.toString() || "");
                setDiscountType(discount?.type || "percentage");
                setDiscountDialogOpen(true);
              }}
            >
              <Tag className="h-3 w-3 mr-1" />
              {discount ? "Edit Diskon" : "Diskon"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                const note = prompt("Catatan pesanan:", notes);
                if (note !== null) setNotes(note);
              }}
            >
              <StickyNote className="h-3 w-3 mr-1" />
              Catatan
            </Button>
          </div>

          {/* Calculation summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calc.subtotal)}</span>
            </div>
            {calc.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Diskon
                </span>
                <span>-{formatCurrency(calc.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Pajak (PB1 {useCartStore.getState().taxRate}%)
              </span>
              <span>{formatCurrency(calc.taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Service ({useCartStore.getState().serviceRate}%)
              </span>
              <span>{formatCurrency(calc.serviceAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(calc.totalAmount)}</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitOrder}
            disabled={isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isPending ? "Memproses..." : "Buat Pesanan & Bayar"}
          </Button>
        </div>
      )}

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atur Diskon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={discountType === "percentage" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscountType("percentage")}
              >
                <Percent className="h-4 w-4 mr-1" /> Persen
              </Button>
              <Button
                variant={discountType === "fixed" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscountType("fixed")}
              >
                <Tag className="h-4 w-4 mr-1" /> Nominal
              </Button>
            </div>
            <Input
              type="number"
              placeholder={
                discountType === "percentage"
                  ? "Masukkan persen (misal: 10)"
                  : "Masukkan nominal (misal: 10000)"
              }
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
            {discount && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDiscount(null);
                  setDiscountDialogOpen(false);
                  toast.info("Diskon dihapus");
                }}
              >
                Hapus Diskon
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleApplyDiscount} className="w-full">
              Terapkan Diskon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Info Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Info Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                <User className="h-3 w-3 inline mr-1" /> Nama
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                <Phone className="h-3 w-3 inline mr-1" /> No. HP (WhatsApp)
              </label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setCustomerDialogOpen(false)}
              className="w-full"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {createdOrderId && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          orderId={createdOrderId}
          totalAmount={createdOrderTotal}
        />
      )}
    </div>
  );
}
