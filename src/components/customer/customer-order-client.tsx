"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
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
  RefreshCw,
  Radio,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  createCustomerOrder,
  getPublicOrderTracking,
} from "@/actions/customer-order";
import { toast } from "sonner";
import { useSocket } from "@/hooks/use-socket";

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
  image?: string | null;
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
  initialTrackingOrder: TrackingOrder | null;
}

interface TrackingOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  itemCounts: {
    PENDING: number;
    COOKING: number;
    READY: number;
    SERVED: number;
    CANCELLED: number;
    total: number;
  };
}

const customerOrderStatusLabel: Record<string, string> = {
  PENDING_APPROVAL: "Menunggu Approval Kasir",
  OPEN: "Sedang Diproses",
  PAID: "Selesai",
  CANCELLED: "Ditolak",
  VOID: "Digabung ke Pesanan Aktif",
};

const customerOrderStatusBadge: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  OPEN: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  VOID: "bg-purple-100 text-purple-800",
};

export function CustomerOrderClient({
  branch,
  categories,
  table,
  initialTrackingOrder,
}: CustomerOrderClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [menuSearch, setMenuSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [trackedOrderNumber, setTrackedOrderNumber] = useState(
    initialTrackingOrder?.orderNumber || ""
  );
  const [trackingOrder, setTrackingOrder] = useState<TrackingOrder | null>(
    initialTrackingOrder
  );
  const [isTrackingRefreshing, setIsTrackingRefreshing] = useState(false);
  const [productDialog, setProductDialog] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { on, isConnected } = useSocket(branch.id);

  const refreshTracking = useCallback(
    async (orderNumberOverride?: string) => {
      const targetOrderNumber =
        orderNumberOverride || trackedOrderNumber || trackingOrder?.orderNumber;
      if (!targetOrderNumber) return;

      setIsTrackingRefreshing(true);
      try {
        const latest = await getPublicOrderTracking({
          branchId: branch.id,
          tableId: table.id,
          orderNumber: targetOrderNumber,
        });

        if (latest) {
          setTrackingOrder(latest);
          setTrackedOrderNumber(latest.orderNumber);
        }
      } finally {
        setIsTrackingRefreshing(false);
      }
    },
    [branch.id, table.id, trackedOrderNumber, trackingOrder?.orderNumber]
  );

  useEffect(() => {
    if (!trackedOrderNumber) return;

    const unsubscribers = [
      on("order-updated", (data) => {
        const payload =
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : null;
        const mergedOrderNumber =
          payload && typeof payload.activeOrderNumber === "string"
            ? payload.activeOrderNumber
            : undefined;

        if (mergedOrderNumber) {
          setTrackedOrderNumber(mergedOrderNumber);
          void refreshTracking(mergedOrderNumber);
          return;
        }

        void refreshTracking();
      }),
      on("order-item-status", () => {
        void refreshTracking();
      }),
      on("payment-completed", () => {
        void refreshTracking();
      }),
      on("table-status-change", () => {
        void refreshTracking();
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [on, refreshTracking, trackedOrderNumber]);

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

  const activeCategoryProducts = useMemo(() => {
    const category = categories.find((item) => item.id === activeCategory);
    return category?.products ?? [];
  }, [activeCategory, categories]);

  const visibleProducts = useMemo(() => {
    const keyword = menuSearch.trim().toLowerCase();
    if (!keyword) return activeCategoryProducts;

    return activeCategoryProducts.filter((product) => {
      const inName = product.name.toLowerCase().includes(keyword);
      const inDescription = (product.description ?? "").toLowerCase().includes(keyword);
      return inName || inDescription;
    });
  }, [activeCategoryProducts, menuSearch]);

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
      image: product.image,
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
        setTrackedOrderNumber(result.data.orderNumber);
        setShowCart(false);
        setShowSuccess(true);
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setOrderNotes("");
        await refreshTracking(result.data.orderNumber);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="relative mx-auto flex h-dvh min-h-0 max-w-lg flex-col overflow-hidden bg-linear-to-b from-background to-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur supports-backdrop-filter:bg-background/90">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Customer Order
            </p>
            <h1 className="mt-0.5 flex items-center gap-2 text-lg font-semibold">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              {branch.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              #{table.number} {table.name ? `• ${table.name}` : ""}
            </p>
          </div>

          <Badge variant="secondary" className="mt-1 rounded-full px-3 py-1 text-[10px]">
            {isConnected ? "Realtime" : "Offline"}
          </Badge>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={menuSearch}
            onChange={(event) => setMenuSearch(event.target.value)}
            placeholder="Cari menu..."
            className="h-10 rounded-xl border-border/70 bg-background pl-10 text-sm"
          />
        </div>
      </header>

      <div className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex gap-2 px-3 py-2.5">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="h-8 shrink-0 rounded-full px-4 text-xs"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="border-b bg-background/80 px-3 py-2">
        <div className="flex items-center justify-between rounded-2xl border bg-card px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            {visibleProducts.length} menu tersedia
          </span>
          <span className="font-semibold text-primary">
            {cartItemCount} item • {formatCurrency(cartTotal.total)}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 p-3 pb-36">
          {visibleProducts.map((product) => (
            <Card
              key={product.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all active:scale-[0.99]"
              onClick={() => openProductDialog(product)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-18 w-18 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    {product.image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ChefHat className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                    {product.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {product.variants.length > 0
                          ? formatCurrency(Number(product.variants[0].price))
                          : formatCurrency(Number(product.price))}
                      </span>
                      {product.variants.length > 1 && (
                        <span className="text-[11px] text-muted-foreground">
                          - {formatCurrency(Number(product.variants[product.variants.length - 1].price))}
                        </span>
                      )}
                    </div>

                    {product.modifierGroups.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {product.modifierGroups.map((pmg) => (
                          <Badge
                            key={pmg.modifierGroup.id}
                            variant="outline"
                            className="rounded-full px-2 py-0 text-[10px]"
                          >
                            {pmg.modifierGroup.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={(event) => {
                      event.stopPropagation();
                      openProductDialog(product);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {visibleProducts.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-background/50 py-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">Menu tidak ditemukan</p>
              <p className="mt-1 text-xs">
                {menuSearch
                  ? "Coba kata kunci lain atau ganti kategori."
                  : "Belum ada menu di kategori ini."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur supports-backdrop-filter:bg-background/85">
        <div className="grid grid-cols-3 gap-2 rounded-3xl border bg-card p-2 shadow-lg">
          <Button
            variant={showCart || showTracking ? "outline" : "default"}
            size="sm"
            className="h-14 flex-col gap-1 rounded-2xl text-[11px]"
            onClick={() => {
              setShowCart(false);
              setShowTracking(false);
            }}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu
          </Button>

          <Button
            variant={showTracking ? "default" : "outline"}
            size="sm"
            className="relative h-14 flex-col gap-1 rounded-2xl text-[11px]"
            onClick={() => {
              if (trackingOrder) {
                setShowTracking(true);
                return;
              }
              toast.info("Belum ada pesanan aktif untuk dilacak.");
            }}
          >
            <Radio className="h-4 w-4" />
            Track
            {trackingOrder && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500" />
            )}
          </Button>

          <Button
            variant={showCart ? "default" : "outline"}
            size="sm"
            className="relative h-14 flex-col gap-1 rounded-2xl text-[11px]"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Keranjang
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-destructive px-1 text-[10px] leading-5 text-destructive-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!productDialog} onOpenChange={() => { setProductDialog(null); resetItemDialog(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{productDialog?.name}</DialogTitle>
          </DialogHeader>
          {productDialog && (
            <div className="space-y-4">
              {productDialog.image && (
                <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={productDialog.image}
                    alt={productDialog.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 420px"
                  />
                </div>
              )}

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
        <DialogContent className="max-h-[92vh] rounded-3xl border bg-background sm:max-w-md flex flex-col">
          <DialogHeader className="border-b pb-3">
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
                    <div key={idx} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-2.5">
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
                            <ChefHat className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

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
                    className="min-h-15"
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
                className="h-12 w-full rounded-xl"
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

      {/* Tracking Dialog */}
      <Dialog open={showTracking} onOpenChange={setShowTracking}>
        <DialogContent className="rounded-3xl border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Track Pesanan</DialogTitle>
          </DialogHeader>

          {trackingOrder ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {trackingOrder.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total {formatCurrency(trackingOrder.totalAmount)}
                  </p>
                </div>
                <Badge className={customerOrderStatusBadge[trackingOrder.status] || ""}>
                  {customerOrderStatusLabel[trackingOrder.status] || trackingOrder.status}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border bg-muted/40 px-1 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                  <p className="text-xs font-semibold">{trackingOrder.itemCounts.PENDING}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 px-1 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Cooking</p>
                  <p className="text-xs font-semibold">{trackingOrder.itemCounts.COOKING}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 px-1 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Ready</p>
                  <p className="text-xs font-semibold">{trackingOrder.itemCounts.READY}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 px-1 py-1.5">
                  <p className="text-[10px] text-muted-foreground">Served</p>
                  <p className="text-xs font-semibold">{trackingOrder.itemCounts.SERVED}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Radio className={`h-3 w-3 ${isConnected ? "text-green-600" : "text-muted-foreground"}`} />
                  {isConnected ? "Realtime aktif" : "Menghubungkan realtime..."}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => void refreshTracking()}
                  disabled={isTrackingRefreshing}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  {isTrackingRefreshing ? "Memuat..." : "Refresh"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada pesanan aktif untuk meja ini.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="rounded-3xl border bg-background sm:max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Pesanan Terkirim!</h2>
            <p className="text-center text-muted-foreground">
              Pesanan Anda <span className="font-semibold text-foreground">{orderNumber}</span>{" "}
              berhasil dikirim.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Tracking status pesanan aktif real-time di halaman ini.
            </p>
            <Button
              className="w-full mt-2"
              onClick={() => setShowSuccess(false)}
            >
              Lanjut Pesan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
