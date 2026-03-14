"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Search,
  BarChart3,
  Pencil,
} from "lucide-react";
import {
  addStockMovement,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/actions/stock";

interface IngredientData {
  id: string;
  name: string;
  unit: string;
  currentStock: number | string;
  minStock: number | string;
  costPerUnit: number | string;
  isActive: boolean;
  recipes: Array<{
    id: string;
    quantity: number | string;
    product: { id: string; name: string };
  }>;
  stockMovements: Array<{
    id: string;
    type: string;
    quantity: number | string;
    notes: string | null;
    createdAt: string;
  }>;
}

interface InventoryClientProps {
  ingredients: IngredientData[];
  lowStockCount: number;
}

const unitLabels: Record<string, string> = {
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILILITER: "mL",
  PIECE: "pcs",
};

const movementTypeLabels: Record<string, { label: string; color: string }> = {
  IN: { label: "Masuk", color: "bg-green-100 text-green-800" },
  OUT: { label: "Keluar", color: "bg-red-100 text-red-800" },
  WASTE: { label: "Waste", color: "bg-yellow-100 text-yellow-800" },
  ADJUSTMENT: { label: "Penyesuaian", color: "bg-blue-100 text-blue-800" },
};

export function InventoryClient({
  ingredients,
  lowStockCount,
}: InventoryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [addIngredientOpen, setAddIngredientOpen] = useState(false);
  const [editIngredientOpen, setEditIngredientOpen] = useState(false);
  const [stockMoveOpen, setStockMoveOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientData | null>(null);

  // Add ingredient form
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("GRAM");
  const [newMinStock, setNewMinStock] = useState("");
  const [newCost, setNewCost] = useState("");

  // Edit ingredient form
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("GRAM");
  const [editMinStock, setEditMinStock] = useState("");
  const [editCost, setEditCost] = useState("");

  // Stock movement form
  const [moveType, setMoveType] = useState<string>("IN");
  const [moveQty, setMoveQty] = useState("");
  const [moveNotes, setMoveNotes] = useState("");

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  function isLowStock(ingredient: IngredientData): boolean {
    return Number(ingredient.currentStock) <= Number(ingredient.minStock);
  }

  function handleAddIngredient() {
    if (!newName.trim()) {
      toast.error("Nama bahan wajib diisi");
      return;
    }
    startTransition(async () => {
      const result = await createIngredient({
        name: newName,
        unit: newUnit,
        minStock: parseFloat(newMinStock) || 0,
        costPerUnit: parseFloat(newCost) || 0,
      });
      if (result.success) {
        toast.success(`${newName} berhasil ditambahkan`);
        setAddIngredientOpen(false);
        setNewName("");
        setNewMinStock("");
        setNewCost("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function openStockMove(ingredient: IngredientData, type: string) {
    setSelectedIngredient(ingredient);
    setMoveType(type);
    setMoveQty("");
    setMoveNotes("");
    setStockMoveOpen(true);
  }

  function openEditIngredient(ingredient: IngredientData) {
    setSelectedIngredient(ingredient);
    setEditName(ingredient.name);
    setEditUnit(ingredient.unit);
    setEditMinStock(String(Number(ingredient.minStock)));
    setEditCost(String(Number(ingredient.costPerUnit)));
    setEditIngredientOpen(true);
  }

  function handleUpdateIngredient() {
    if (!selectedIngredient) return;

    if (!editName.trim()) {
      toast.error("Nama bahan wajib diisi");
      return;
    }

    startTransition(async () => {
      const result = await updateIngredient(selectedIngredient.id, {
        name: editName.trim(),
        unit: editUnit,
        minStock: parseFloat(editMinStock) || 0,
        costPerUnit: parseFloat(editCost) || 0,
      });

      if (result.success) {
        toast.success("Bahan berhasil diperbarui");
        setEditIngredientOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteIngredient() {
    if (!selectedIngredient) return;
    if (!window.confirm(`Hapus bahan ${selectedIngredient.name}?`)) return;

    startTransition(async () => {
      const result = await deleteIngredient(selectedIngredient.id);

      if (result.success) {
        toast.success("Bahan berhasil dihapus");
        setEditIngredientOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleStockMove() {
    if (!selectedIngredient) return;
    const qty = parseFloat(moveQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    startTransition(async () => {
      const result = await addStockMovement({
        ingredientId: selectedIngredient.id,
        type: moveType,
        quantity: qty,
        notes: moveNotes || undefined,
      });
      if (result.success) {
        toast.success("Stok berhasil diperbarui");
        setStockMoveOpen(false);
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
        <div>
          <h1 className="text-3xl font-bold">Inventori</h1>
          <p className="text-muted-foreground">
            Kelola stok bahan baku dan pergerakan stok
          </p>
        </div>
        <Button onClick={() => setAddIngredientOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Bahan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bahan</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stok Rendah</p>
              <p className="text-2xl font-bold text-red-600">
                {lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stok Aman</p>
              <p className="text-2xl font-bold text-green-600">
                {ingredients.length - lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari bahan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Ingredients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bahan</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Min. Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Digunakan di</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ingredient) => {
                const low = isLowStock(ingredient);
                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={low ? "text-red-600 font-bold" : ""}>
                        {Number(ingredient.currentStock).toLocaleString("id-ID")}
                      </span>{" "}
                      <span className="text-muted-foreground text-xs">
                        {unitLabels[ingredient.unit] || ingredient.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(ingredient.minStock).toLocaleString("id-ID")}{" "}
                      <span className="text-muted-foreground text-xs">
                        {unitLabels[ingredient.unit] || ingredient.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {low ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Rendah
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600"
                        >
                          Aman
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ingredient.recipes.slice(0, 3).map((r) => (
                          <Badge
                            key={r.id}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {r.product.name}
                          </Badge>
                        ))}
                        {ingredient.recipes.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{ingredient.recipes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          title="Stok Masuk"
                          onClick={() => openStockMove(ingredient, "IN")}
                        >
                          <ArrowDownToLine className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          title="Stok Keluar"
                          onClick={() => openStockMove(ingredient, "OUT")}
                        >
                          <ArrowUpFromLine className="h-3 w-3 text-red-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit Bahan"
                          onClick={() => openEditIngredient(ingredient)}
                        >
                          <Pencil className="h-3 w-3 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          title="Waste"
                          onClick={() => openStockMove(ingredient, "WASTE")}
                        >
                          <Trash2 className="h-3 w-3 text-yellow-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search
                        ? "Tidak ada bahan ditemukan"
                        : "Belum ada bahan baku"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Ingredient Dialog */}
      <Dialog open={addIngredientOpen} onOpenChange={setAddIngredientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Bahan Baku</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama bahan"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Satuan</label>
              <Select value={newUnit} onValueChange={(v) => v && setNewUnit(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KILOGRAM">Kilogram (kg)</SelectItem>
                  <SelectItem value="GRAM">Gram (g)</SelectItem>
                  <SelectItem value="LITER">Liter (L)</SelectItem>
                  <SelectItem value="MILILITER">Mililiter (mL)</SelectItem>
                  <SelectItem value="PIECE">Piece (pcs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Stok Minimum</label>
              <Input
                type="number"
                value={newMinStock}
                onChange={(e) => setNewMinStock(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Harga per Satuan</label>
              <Input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddIngredientOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleAddIngredient} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ingredient Dialog */}
      <Dialog open={editIngredientOpen} onOpenChange={setEditIngredientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bahan Baku</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Satuan</label>
              <Select value={editUnit} onValueChange={(v) => v && setEditUnit(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KILOGRAM">Kilogram (kg)</SelectItem>
                  <SelectItem value="GRAM">Gram (g)</SelectItem>
                  <SelectItem value="LITER">Liter (L)</SelectItem>
                  <SelectItem value="MILILITER">Mililiter (mL)</SelectItem>
                  <SelectItem value="PIECE">Piece (pcs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Stok Minimum</label>
              <Input
                type="number"
                value={editMinStock}
                onChange={(e) => setEditMinStock(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Harga per Satuan</label>
              <Input
                type="number"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDeleteIngredient}
              disabled={isPending}
            >
              Hapus
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditIngredientOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateIngredient} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={stockMoveOpen} onOpenChange={setStockMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementTypeLabels[moveType]?.label || "Stok"} —{" "}
              {selectedIngredient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p>
                Stok saat ini:{" "}
                <strong>
                  {Number(
                    selectedIngredient?.currentStock ?? 0
                  ).toLocaleString("id-ID")}{" "}
                  {unitLabels[selectedIngredient?.unit || ""] ||
                    selectedIngredient?.unit}
                </strong>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                value={moveQty}
                onChange={(e) => setMoveQty(e.target.value)}
                placeholder="Masukkan jumlah"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catatan</label>
              <Textarea
                value={moveNotes}
                onChange={(e) => setMoveNotes(e.target.value)}
                placeholder="Catatan (opsional)"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockMoveOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleStockMove} disabled={isPending}>
              {isPending ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
