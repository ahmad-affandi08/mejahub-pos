"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Minus, Coffee, UtensilsCrossed } from "lucide-react";
import type { ProductWithRelations } from "./pos-client";
import { formatCurrency } from "@/lib/utils";

interface ProductGridProps {
  products: ProductWithRelations[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithRelations | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Modifier dialog state
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  const addItem = useCartStore((s) => s.addItem);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach((p) => cats.set(p.category.id, p.category.name));
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filter products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable) return false;
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  function openProductDialog(product: ProductWithRelations) {
    const hasVariants = product.variants.length > 0;
    const hasModifiers = product.modifierGroups.length > 0;

    if (!hasVariants && !hasModifiers) {
      // Quick add — no dialog needed
      addItem({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: Number(product.price),
        quantity: 1,
        modifiers: [],
      });
      toast.success(`${product.name} ditambahkan`);
      return;
    }

    // Open dialog for variant/modifier selection
    setSelectedProduct(product);
    setSelectedVariantId(
      hasVariants ? product.variants[0]?.id : undefined
    );
    setSelectedModifiers({});
    setItemQuantity(1);
    setItemNotes("");
    setDialogOpen(true);
  }

  function handleAddToCart() {
    if (!selectedProduct) return;

    // Validate required modifiers
    for (const pmg of selectedProduct.modifierGroups) {
      const mg = pmg.modifierGroup;
      if (mg.isRequired) {
        const selected = selectedModifiers[mg.id] || [];
        if (selected.length < mg.minSelect) {
          toast.error(`${mg.name}: Pilih minimal ${mg.minSelect}`);
          return;
        }
      }
    }

    // Build price
    let price = Number(selectedProduct.price);
    let variantName: string | undefined;
    if (selectedVariantId) {
      const variant = selectedProduct.variants.find(
        (v) => v.id === selectedVariantId
      );
      if (variant) {
        price = Number(variant.price);
        variantName = variant.name;
      }
    }

    // Build modifiers
    const modifiers: CartItem["modifiers"] = [];
    for (const pmg of selectedProduct.modifierGroups) {
      const group = pmg.modifierGroup;
      const selectedIds = selectedModifiers[group.id] || [];
      for (const modId of selectedIds) {
        const mod = group.modifiers.find((m) => m.id === modId);
        if (mod) {
          modifiers.push({
            modifierId: mod.id,
            name: mod.name,
            price: Number(mod.price),
          });
        }
      }
    }

    addItem({
      productId: selectedProduct.id,
      variantId: selectedVariantId,
      name: selectedProduct.name,
      image: selectedProduct.image,
      variantName,
      price,
      quantity: itemQuantity,
      notes: itemNotes || undefined,
      modifiers,
    });

    toast.success(`${selectedProduct.name} ditambahkan`);
    setDialogOpen(false);
  }

  function toggleModifier(groupId: string, modifierId: string, type: string, maxSelect: number) {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];

      if (type === "SINGLE") {
        // Radio — replace
        return { ...prev, [groupId]: [modifierId] };
      }

      // Multiple — toggle
      if (current.includes(modifierId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== modifierId),
        };
      }

      if (current.length >= maxSelect) {
        toast.error(`Maksimal ${maxSelect} pilihan`);
        return prev;
      }

      return { ...prev, [groupId]: [...current, modifierId] };
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search + Category Filter */}
      <div className="border-b p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            Semua
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
              onClick={() => openProductDialog(product)}
            >
              <CardContent className="p-0">
                {product.image ? (
                  <div className="relative h-24 w-full overflow-hidden rounded-t-xl border-b bg-muted">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-t-xl border-b bg-muted">
                    {product.station === "BAR" ? (
                      <Coffee className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}

                <div className="p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      {product.station === "BAR" ? (
                        <Coffee className="h-4 w-4 text-primary" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {product.variants.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {product.variants.length} varian
                      </Badge>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {formatCurrency(Number(product.price))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Variant/Modifier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProduct?.image && (
              <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 420px"
                />
              </div>
            )}

            {/* Variants */}
            {selectedProduct && selectedProduct.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Pilih Ukuran</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={
                        selectedVariantId === variant.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className="flex flex-col h-auto py-2"
                    >
                      <span className="text-xs">{variant.name}</span>
                      <span className="text-[10px] opacity-80">
                        {formatCurrency(Number(variant.price))}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifier Groups */}
            {selectedProduct?.modifierGroups.map(({ modifierGroup: mg }) => (
              <div key={mg.id}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium">{mg.name}</p>
                  {mg.isRequired && (
                    <Badge variant="destructive" className="text-[10px]">
                      Wajib
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {mg.type === "SINGLE"
                      ? "Pilih 1"
                      : `Pilih maks. ${mg.maxSelect}`}
                  </span>
                </div>
                <div className="space-y-1">
                  {mg.modifiers.map((mod) => {
                    const isSelected = (
                      selectedModifiers[mg.id] || []
                    ).includes(mod.id);
                    return (
                      <Button
                        key={mod.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-between h-auto py-2"
                        onClick={() =>
                          toggleModifier(mg.id, mod.id, mg.type, mg.maxSelect)
                        }
                      >
                        <span>{mod.name}</span>
                        {Number(mod.price) > 0 && (
                          <span className="text-xs">
                            +{formatCurrency(Number(mod.price))}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <p className="text-sm font-medium mb-2">Catatan</p>
              <Textarea
                placeholder="Contoh: tidak pakai es, level pedas 3..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Jumlah</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {itemQuantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddToCart} className="w-full">
              Tambah ke Keranjang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
