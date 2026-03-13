"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategory, deleteCategory, updateCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface CategoryManagerProps {
  categories: CategoryData[];
  branchId: string;
}

export function CategoryManager({ categories, branchId }: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const query = search.toLowerCase();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  function openCreateDialog() {
    setEditingId(null);
    setName("");
    setDescription("");
    setSortOrder("0");
    setDialogOpen(true);
  }

  function openEditDialog(category: CategoryData) {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setSortOrder(String(category.sortOrder));
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      if (description.trim()) {
        formData.set("description", description.trim());
      }
      formData.set("sortOrder", sortOrder || "0");
      if (!editingId) {
        formData.set("branchId", branchId);
      }

      const result = editingId
        ? await updateCategory(editingId, formData)
        : await createCategory(formData);

      if (result.success) {
        toast.success(editingId ? "Kategori diperbarui" : "Kategori ditambahkan");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string, categoryName: string) {
    if (!window.confirm(`Hapus kategori ${categoryName}?`)) return;

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        toast.success("Kategori dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Cari kategori..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />
        <Button onClick={openCreateDialog}>Tambah Kategori</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="transition-all hover:shadow-md">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  #{category.sortOrder}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {category.description ? (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tanpa deskripsi</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(category)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={isPending}
                >
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {search.trim()
              ? "Tidak ada kategori yang cocok"
              : "Belum ada kategori. Mulai dengan menambahkan kategori baru."}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">Nama</p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Makanan Utama"
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
              <p className="mb-1 text-sm font-medium">Urutan</p>
              <Input
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                min={0}
              />
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
    </div>
  );
}
