"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, FlaskConical, Plus, Save, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { upsertProductRecipe } from "@/actions/recipe";

interface IngredientItem {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number | string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number | string;
  category: { id: string; name: string };
  recipes: Array<{
    id: string;
    quantity: number | string;
    ingredientId: string;
    ingredient: IngredientItem;
  }>;
}

interface EditableRecipeRow {
  ingredientId: string;
  quantity: string;
}

const unitLabels: Record<string, string> = {
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILILITER: "mL",
  PIECE: "pcs",
};

export function RecipeManager({
  products,
  ingredients,
}: {
  products: ProductItem[];
  ingredients: IngredientItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState<EditableRecipeRow[]>([]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === selectedProductId) ??
      filteredProducts[0] ??
      null,
    [filteredProducts, products, selectedProductId]
  );

  function openEditor() {
    if (!selectedProduct) return;
    setRows(
      selectedProduct.recipes.length > 0
        ? selectedProduct.recipes.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: Number(item.quantity).toString(),
          }))
        : [{ ingredientId: ingredients[0]?.id ?? "", quantity: "" }]
    );
    setDialogOpen(true);
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { ingredientId: ingredients[0]?.id ?? "", quantity: "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function updateRow(index: number, patch: Partial<EditableRecipeRow>) {
    setRows((current) =>
      current.map((row, currentIndex) =>
        currentIndex === index ? { ...row, ...patch } : row
      )
    );
  }

  function saveRecipe() {
    if (!selectedProduct) return;

    const duplicateIds = rows
      .map((row) => row.ingredientId)
      .filter((id, index, current) => current.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      toast.error("Satu bahan hanya boleh muncul sekali di resep.");
      return;
    }

    const items = rows
      .filter((row) => row.ingredientId && Number(row.quantity) > 0)
      .map((row) => ({
        ingredientId: row.ingredientId,
        quantity: Number(row.quantity),
      }));

    startTransition(async () => {
      const result = await upsertProductRecipe({
        productId: selectedProduct.id,
        items,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Resep berhasil disimpan.");
      setDialogOpen(false);
      router.refresh();
    });
  }

  const estimatedCost = selectedProduct?.recipes.reduce((sum, item) => {
    return sum + Number(item.quantity) * Number(item.ingredient.costPerUnit);
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resep / Bill of Materials</h1>
          <p className="text-muted-foreground">
            Hubungkan menu ke bahan baku agar stok dan COGS bergerak otomatis.
          </p>
        </div>
        <Button onClick={openEditor} disabled={!selectedProduct}>
          <FlaskConical className="mr-2 h-4 w-4" /> Atur Resep
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari menu atau kategori"
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-120 pr-3">
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      product.id === selectedProduct?.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category.name}
                        </p>
                      </div>
                      <Badge variant={product.recipes.length > 0 ? "default" : "outline"}>
                        {product.recipes.length > 0 ? `${product.recipes.length} bahan` : "Belum ada resep"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedProduct?.name || "Pilih menu"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedProduct ? (
              <p className="text-sm text-muted-foreground">
                Pilih produk di sebelah kiri untuk melihat bill of materials.
              </p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Harga Jual</p>
                      <p className="text-2xl font-bold">{formatCurrency(Number(selectedProduct.price))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Bahan</p>
                      <p className="text-2xl font-bold">{selectedProduct.recipes.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Estimasi COGS</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(estimatedCost)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bahan</TableHead>
                      <TableHead>Qty per Menu</TableHead>
                      <TableHead>Biaya Unit</TableHead>
                      <TableHead className="text-right">Biaya Pakai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProduct.recipes.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{recipe.ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {unitLabels[recipe.ingredient.unit] || recipe.ingredient.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {Number(recipe.quantity).toLocaleString("id-ID")} {unitLabels[recipe.ingredient.unit] || recipe.ingredient.unit}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(recipe.ingredient.costPerUnit))}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(recipe.quantity) * Number(recipe.ingredient.costPerUnit))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedProduct.recipes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          Produk ini belum memiliki resep. Klik Atur Resep.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atur Resep - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={`${row.ingredientId}-${index}`} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_180px_auto]">
                <div>
                  <Label>Bahan</Label>
                  <select
                    value={row.ingredientId}
                    onChange={(event) => updateRow(index, { ingredientId: event.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Qty per menu</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={row.quantity}
                    onChange={(event) => updateRow(index, { quantity: event.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="destructive" size="icon" onClick={() => removeRow(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" /> Tambah bahan
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveRecipe} disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Menyimpan..." : "Simpan Resep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
