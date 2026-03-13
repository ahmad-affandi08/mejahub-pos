"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  ChefHat,
  CheckCircle,
  UtensilsCrossed,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createCustomerOrder } from "@/actions/customer-order";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  taxRate: number;
  serviceRate: number;
}

interface Modifier {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  type: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  station: string;
  isAvailable: boolean;
  variants: {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }[];
  modifierGroups: {
    modifierGroup: ModifierGroup;
  }[];
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface TableInfo {
  id: string;
  number: number;
  name: string | null;
  status: string;
}

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  notes: string;
  modifiers: { modifierId: string; name: string; price: number }[];
}

interface CustomerOrderClientProps {
  branch: Branch;
  categories: Category[];
  table: TableInfo;
}

export function CustomerOrderClient({
  branch,
  categories,
  table,
}: CustomerOrderClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [productDialog, setProductDialog] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const taxRate = Number(branch.taxRate);
  const serviceRate = Number(branch.serviceRate);

  const cartTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      return sum + (item.price + modTotal) * item.quantity;
    }, 0);
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const serviceAmount = Math.round(subtotal * (serviceRate / 100));
    return {
      subtotal,
      taxAmount,
      serviceAmount,
      total: subtotal + taxAmount + serviceAmount,
    };
  }, [cart, taxRate, serviceRate]);

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = () => {
    if (!productDialog) return;

    const product = productDialog;
    let price = Number(product.price);
    let variantName: string | undefined;

    if (selectedVariant) {
      const variant = product.variants.find((v) => v.id === selectedVariant);
      if (variant) {
        price = Number(variant.price);
        variantName = variant.name;
      }
    }

    const modifiers: CartItem["modifiers"] = [];
    for (const [, modIds] of Object.entries(selectedModifiers)) {
      for (const modId of modIds) {
        for (const pmg of product.modifierGroups) {
          const mod = pmg.modifierGroup.modifiers.find((m) => m.id === modId);
          if (mod) {
            modifiers.push({
              modifierId: mod.id,
              name: mod.name,
              price: Number(mod.price),
            });
          }
        }
      }
    }

    const newItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant,
      name: product.name,
      variantName,
      price,
      quantity: itemQuantity,
      notes: itemNotes,
      modifiers,
    };

    // Check if same product+variant+modifiers exists
    const existingIdx = cart.findIndex(
      (i) =>
        i.productId === newItem.productId &&
        i.variantId === newItem.variantId &&
        JSON.stringify(i.modifiers.map((m) => m.modifierId).sort()) ===
          JSON.stringify(newItem.modifiers.map((m) => m.modifierId).sort())
    );

    if (existingIdx >= 0) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + itemQuantity }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, newItem]);
    }

    setProductDialog(null);
    resetItemDialog();
    toast.success(`${product.name} ditambahkan`);
  };

  const resetItemDialog = () => {
    setSelectedVariant(undefined);
    setSelectedModifiers({});
    setItemQuantity(1);
    setItemNotes("");
  };

  const openProductDialog = (product: Product) => {
    resetItemDialog();
    if (product.variants.length > 0) {
      setSelectedVariant(product.variants[0].id);
    }
    setProductDialog(product);
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQty = (index: number, qty: number) => {
    if (qty <= 0) {
      removeCartItem(index);
      return;
    }
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    );
  };

  const handleToggleModifier = (groupId: string, modifierId: string, type: "SINGLE" | "MULTIPLE") => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (type === "SINGLE") {
        return { ...prev, [groupId]: [modifierId] };
      }
      // MULTIPLE toggle
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }
      return { ...prev, [groupId]: [...current, modifierId] };
    });
  };

  const submitOrder = () => {
    if (!customerName.trim()) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    startTransition(async () => {
      const result = await createCustomerOrder({
        branchId: branch.id,
        tableId: table.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes || undefined,
          modifiers: item.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      });

      if (result.success) {
        setOrderNumber(result.data.orderNumber);
        setShowCart(false);
        setShowSuccess(true);
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setOrderNotes("");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {branch.name}
            </h1>
            <p className="text-sm opacity-80">
              Meja #{table.number} {table.name ? `• ${table.name}` : ""}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="relative"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[73px] z-20 bg-background border-b">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex gap-2 p-3">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Product List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {categories
            .filter((c) => c.id === activeCategory)
            .flatMap((c) => c.products)
            .map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openProductDialog(product)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-bold text-sm text-primary">
                          {product.variants.length > 0
                            ? `${formatCurrency(Number(product.variants[0].price))}`
                            : formatCurrency(Number(product.price))}
                        </span>
                        {product.variants.length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            - {formatCurrency(Number(product.variants[product.variants.length - 1].price))}
                          </span>
                        )}
                      </div>
                      {product.modifierGroups.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {product.modifierGroups.map((pmg) => (
                            <Badge
                              key={pmg.modifierGroup.id}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {pmg.modifierGroup.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-muted shrink-0">
                      <ChefHat className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {categories.find((c) => c.id === activeCategory)?.products.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tidak ada produk di kategori ini</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && !showCart && (
        <div className="sticky bottom-0 p-3 bg-background border-t">
          <Button
            className="w-full h-12"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Lihat Keranjang ({cartItemCount} item) •{" "}
            {formatCurrency(cartTotal.total)}
          </Button>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!productDialog} onOpenChange={() => { setProductDialog(null); resetItemDialog(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productDialog?.name}</DialogTitle>
          </DialogHeader>
          {productDialog && (
            <div className="space-y-4">
              {productDialog.description && (
                <p className="text-sm text-muted-foreground">
                  {productDialog.description}
                </p>
              )}

              {/* Variants */}
              {productDialog.variants.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Pilih Ukuran</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {productDialog.variants.map((v) => (
                      <Button
                        key={v.id}
                        size="sm"
                        variant={selectedVariant === v.id ? "default" : "outline"}
                        className="text-xs"
                        onClick={() => setSelectedVariant(v.id)}
                      >
                        {v.name}
                        <br />
                        {formatCurrency(Number(v.price))}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifiers */}
              {productDialog.modifierGroups.map((pmg) => {
                const group = pmg.modifierGroup;
                return (
                  <div key={group.id}>
                    <Label className="text-sm font-semibold">
                      {group.name}
                      {group.isRequired && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {group.type === "SINGLE"
                        ? "Pilih satu"
                        : `Pilih hingga ${group.maxSelect}`}
                    </p>
                    <div className="space-y-1.5">
                      {group.modifiers.map((mod) => {
                        const selected = selectedModifiers[group.id]?.includes(mod.id) || false;
                        return (
                          <Button
                            key={mod.id}
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            className="w-full justify-between text-xs"
                            onClick={() =>
                              handleToggleModifier(group.id, mod.id, group.type)
                            }
                          >
                            <span>{mod.name}</span>
                            {Number(mod.price) > 0 && (
                              <span>+{formatCurrency(Number(mod.price))}</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Notes */}
              <div>
                <Label className="text-sm font-semibold">Catatan</Label>
                <Input
                  className="mt-1"
                  placeholder="Contoh: Tidak pakai nasi"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Jumlah</Label>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-bold">{itemQuantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button className="w-full h-11" onClick={addToCart}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah ke Keranjang
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <ShoppingCart className="inline mr-2 h-5 w-5" />
              Keranjang ({cartItemCount} item)
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[40vh]">
            <div className="space-y-3 pr-2">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keranjang masih kosong
                </p>
              ) : (
                cart.map((item, idx) => {
                  const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
                  const itemTotal = (item.price + modTotal) * item.quantity;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.name}
                          {item.variantName && (
                            <span className="text-muted-foreground">
                              {" "}• {item.variantName}
                            </span>
                          )}
                        </p>
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-sm font-bold mt-1">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateCartItemQty(idx, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateCartItemQty(idx, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => removeCartItem(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              <Separator />

              {/* Customer Info */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">
                    Nama <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Nama Anda"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">No. HP (untuk e-receipt WhatsApp)</Label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Catatan Pesanan</Label>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartTotal.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    PB1 ({taxRate}%)
                  </span>
                  <span>{formatCurrency(cartTotal.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Service ({serviceRate}%)
                  </span>
                  <span>{formatCurrency(cartTotal.serviceAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal.total)}</span>
                </div>
              </div>

              <Button
                className="w-full h-12"
                onClick={submitOrder}
                disabled={isPending || !customerName.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                {isPending ? "Mengirim..." : "Kirim Pesanan"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Pesanan Terkirim!</h2>
            <p className="text-center text-muted-foreground">
              Pesanan Anda <span className="font-semibold text-foreground">{orderNumber}</span>{" "}
              sedang diproses oleh dapur.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Silakan duduk dan tunggu pesanan Anda diantar ke meja.
            </p>
            <Button
              className="w-full mt-2"
              onClick={() => setShowSuccess(false)}
            >
              Pesan Lagi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
