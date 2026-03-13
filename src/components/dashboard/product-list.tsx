"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Search, ChefHat, Wine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  deleteProduct,
  toggleProductAvailability,
  updateProduct,
} from "@/actions/product";
import { ProductOptionsDialog } from "@/components/dashboard/product-options-dialog";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  image: string | null;
  station: "KITCHEN" | "BAR";
  isAvailable: boolean;
  sku: string | null;
  category: { id: string; name: string };
  variants: { id: string; name: string; price: unknown; sku: string | null }[];
  modifierGroups: {
    id: string;
    modifierGroupId: string;
    modifierGroup: {
      id: string;
      name: string;
      type: "SINGLE" | "MULTIPLE";
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      modifiers: { id: string; name: string; price: unknown }[];
    };
  }[];
}

interface CategoryData {
  id: string;
  name: string;
}

interface AvailableModifierGroupData {
  id: string;
  name: string;
  type: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: { id: string; name: string; price: unknown }[];
}

interface ProductListProps {
  products: ProductData[];
  categories: CategoryData[];
  branchId: string;
  availableModifierGroups: AvailableModifierGroupData[];
}

export function ProductList({
  products,
  categories,
  branchId,
  availableModifierGroups,
}: ProductListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [optionsProductId, setOptionsProductId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [station, setStation] = useState<"KITCHEN" | "BAR">("KITCHEN");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const activeImagePreview = localImagePreview ?? (removeImage ? null : existingImage);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === "all" || product.category.id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const optionsProduct = useMemo(
    () => products.find((product) => product.id === optionsProductId) ?? null,
    [products, optionsProductId]
  );

  function handleImageSelection(file: File | null) {
    setImageFile(file);

    if (!file) {
      setLocalImagePreview(null);
      return;
    }

    setRemoveImage(false);

    const reader = new FileReader();
    reader.onload = () => {
      setLocalImagePreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => {
      setLocalImagePreview(null);
      toast.error("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  }

  function openCreateDialog() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setSku("");
    setStation("KITCHEN");
    setCategoryId(categories[0]?.id ?? "");
    setImageFile(null);
    setExistingImage(null);
    setLocalImagePreview(null);
    setRemoveImage(false);
    setDialogOpen(true);
  }

  function openEditDialog(product: ProductData) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(Number(product.price)));
    setSku(product.sku ?? "");
    setStation(product.station);
    setCategoryId(product.category.id);
    setImageFile(null);
    setExistingImage(product.image ?? null);
    setLocalImagePreview(null);
    setRemoveImage(false);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    if (!categoryId) {
      toast.error("Kategori wajib dipilih");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      if (description.trim()) {
        formData.set("description", description.trim());
      }
      formData.set("price", price || "0");
      if (sku.trim()) {
        formData.set("sku", sku.trim());
      }
      formData.set("station", station);
      formData.set("categoryId", categoryId);
      if (imageFile) {
        formData.set("imageFile", imageFile);
      }
      if (editingId && removeImage) {
        formData.set("removeImage", "true");
      }
      if (!editingId) {
        formData.set("branchId", branchId);
      }

      const result = editingId
        ? await updateProduct(editingId, formData)
        : await createProduct(formData);

      if (result.success) {
        toast.success(editingId ? "Produk diperbarui" : "Produk ditambahkan");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggleAvailability(product: ProductData) {
    startTransition(async () => {
      const result = await toggleProductAvailability(product.id);
      if (result.success) {
        toast.success(
          product.isAvailable ? "Produk dinonaktifkan" : "Produk diaktifkan"
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(product: ProductData) {
    if (!window.confirm(`Hapus produk ${product.name}?`)) return;

    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.success) {
        toast.success("Produk dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full sm:w-auto"
        >
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Semua</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={openCreateDialog} className="sm:ml-3">
          Tambah Produk
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className={cn(
              "transition-all hover:shadow-md",
              !product.isAvailable && "opacity-60"
            )}
          >
            {product.image ? (
              <div className="h-36 overflow-hidden rounded-t-xl border-b bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center rounded-t-xl border-b bg-muted text-xs text-muted-foreground">
                Tanpa gambar
              </div>
            )}
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  {product.name}
                </CardTitle>
                <Badge
                  variant={product.isAvailable ? "default" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {product.isAvailable ? "Tersedia" : "Habis"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(Number(product.price))}
                </span>
                <div className="flex items-center gap-1">
                  {product.station === "KITCHEN" ? (
                    <ChefHat className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Wine className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {product.station === "KITCHEN" ? "Dapur" : "Bar"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{product.category.name}</span>
                {product.variants.length > 0 && (
                  <span>{product.variants.length} varian</span>
                )}
              </div>
              {product.variants.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((v) => (
                    <Badge key={v.id} variant="outline" className="text-xs">
                      {v.name}: {formatCurrency(Number(v.price))}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => openEditDialog(product)}
                  disabled={isPending}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleToggleAvailability(product)}
                  disabled={isPending}
                >
                  {product.isAvailable ? "Non-aktifkan" : "Aktifkan"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDelete(product)}
                  disabled={isPending}
                >
                  Hapus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setOptionsProductId(product.id)}
                >
                  Opsi
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mb-2" />
          <p>Tidak ada produk ditemukan</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">Nama Produk</p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Kopi Susu"
              />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Deskripsi</p>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Opsional"
                rows={3}
              />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Gambar Produk</p>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  handleImageSelection(event.target.files?.[0] ?? null);
                }}
              />
              {activeImagePreview ? (
                <div className="mt-2 overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImagePreview}
                    alt="Preview gambar produk"
                    className="h-36 w-full object-cover"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Belum ada gambar.</p>
              )}
              {editingId && existingImage && !removeImage && !imageFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setRemoveImage(true);
                    setImageFile(null);
                    setLocalImagePreview(null);
                  }}
                >
                  Hapus gambar
                </Button>
              )}
              {editingId && removeImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setRemoveImage(false)}
                >
                  Batalkan hapus gambar
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Harga</p>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">SKU</p>
                <Input
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="Opsional"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Kategori</p>
                <Select
                  value={categoryId}
                  onValueChange={(value) => value && setCategoryId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Stasiun</p>
                <Select
                  value={station}
                  onValueChange={(value) => setStation(value as "KITCHEN" | "BAR")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih stasiun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KITCHEN">Dapur</SelectItem>
                    <SelectItem value="BAR">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductOptionsDialog
        key={optionsProductId ?? "none"}
        open={!!optionsProductId}
        onOpenChange={(open) => {
          if (!open) {
            setOptionsProductId(null);
          }
        }}
        product={optionsProduct}
        availableModifierGroups={availableModifierGroups}
      />
    </div>
  );
}
