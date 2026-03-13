"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  attachExistingModifierGroup,
  createModifier,
  createProductModifierGroup,
  createProductVariant,
  deleteModifier,
  deleteProductVariant,
  removeProductModifierGroup,
  updateModifier,
  updateModifierGroup,
  updateProductVariant,
} from "@/actions/product";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProductOptionData {
  id: string;
  name: string;
  variants: {
    id: string;
    name: string;
    price: unknown;
    sku: string | null;
  }[];
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
      modifiers: {
        id: string;
        name: string;
        price: unknown;
      }[];
    };
  }[];
}

interface ProductOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductOptionData | null;
  availableModifierGroups: {
    id: string;
    name: string;
    type: "SINGLE" | "MULTIPLE";
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    modifiers: {
      id: string;
      name: string;
      price: unknown;
    }[];
  }[];
}

export function ProductOptionsDialog({
  open,
  onOpenChange,
  product,
  availableModifierGroups,
}: ProductOptionsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantSku, setVariantSku] = useState("");

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"SINGLE" | "MULTIPLE">("SINGLE");
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMinSelect, setGroupMinSelect] = useState("0");
  const [groupMaxSelect, setGroupMaxSelect] = useState("1");

  const [editingModifierId, setEditingModifierId] = useState<string | null>(null);
  const [modifierTargetGroupId, setModifierTargetGroupId] = useState<string | null>(null);
  const [modifierName, setModifierName] = useState("");
  const [modifierPrice, setModifierPrice] = useState("0");
  const [selectedExistingGroupId, setSelectedExistingGroupId] = useState("");

  const linkedGroupIds = new Set(
    product?.modifierGroups.map((group) => group.modifierGroupId) ?? []
  );

  const attachableModifierGroups = availableModifierGroups.filter(
    (group) => !linkedGroupIds.has(group.id)
  );

  function attachExistingGroup() {
    if (!product) return;
    if (!selectedExistingGroupId) {
      toast.error("Pilih modifier group terlebih dahulu");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      formData.set("modifierGroupId", selectedExistingGroupId);

      const result = await attachExistingModifierGroup(formData);

      if (result.success) {
        toast.success("Modifier group berhasil dipasang");
        setSelectedExistingGroupId("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function loadVariantForEdit(variant: ProductOptionData["variants"][number]) {
    setEditingVariantId(variant.id);
    setVariantName(variant.name);
    setVariantPrice(String(Number(variant.price)));
    setVariantSku(variant.sku ?? "");
  }

  function resetVariantForm() {
    setEditingVariantId(null);
    setVariantName("");
    setVariantPrice("");
    setVariantSku("");
  }

  function submitVariant() {
    if (!product) return;
    if (!variantName.trim()) {
      toast.error("Nama varian wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", variantName.trim());
      formData.set("price", variantPrice || "0");
      if (variantSku.trim()) {
        formData.set("sku", variantSku.trim());
      }
      if (!editingVariantId) {
        formData.set("productId", product.id);
      }

      const result = editingVariantId
        ? await updateProductVariant(editingVariantId, formData)
        : await createProductVariant(formData);

      if (result.success) {
        toast.success(editingVariantId ? "Varian diperbarui" : "Varian ditambahkan");
        resetVariantForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeVariant(variantId: string) {
    if (!window.confirm("Hapus varian ini?")) return;

    startTransition(async () => {
      const result = await deleteProductVariant(variantId);
      if (result.success) {
        toast.success("Varian dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function loadGroupForEdit(group: ProductOptionData["modifierGroups"][number]) {
    setEditingGroupId(group.modifierGroup.id);
    setGroupName(group.modifierGroup.name);
    setGroupType(group.modifierGroup.type);
    setGroupRequired(group.modifierGroup.isRequired);
    setGroupMinSelect(String(group.modifierGroup.minSelect));
    setGroupMaxSelect(String(group.modifierGroup.maxSelect));
  }

  function resetGroupForm() {
    setEditingGroupId(null);
    setGroupName("");
    setGroupType("SINGLE");
    setGroupRequired(false);
    setGroupMinSelect("0");
    setGroupMaxSelect("1");
  }

  function submitGroup() {
    if (!product) return;
    if (!groupName.trim()) {
      toast.error("Nama modifier group wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", groupName.trim());
      formData.set("type", groupType);
      formData.set("isRequired", String(groupRequired));
      formData.set("minSelect", groupMinSelect || "0");
      formData.set("maxSelect", groupMaxSelect || "1");
      if (!editingGroupId) {
        formData.set("productId", product.id);
      }

      const result = editingGroupId
        ? await updateModifierGroup(editingGroupId, formData)
        : await createProductModifierGroup(formData);

      if (result.success) {
        toast.success(
          editingGroupId ? "Modifier group diperbarui" : "Modifier group ditambahkan"
        );
        resetGroupForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function unlinkGroup(group: ProductOptionData["modifierGroups"][number]) {
    if (!product) return;
    if (!window.confirm("Lepas modifier group dari produk ini?")) return;

    startTransition(async () => {
      const result = await removeProductModifierGroup(
        product.id,
        group.modifierGroupId
      );

      if (result.success) {
        toast.success("Modifier group dilepas dari produk");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function openModifierForm(groupId: string) {
    setModifierTargetGroupId(groupId);
    setEditingModifierId(null);
    setModifierName("");
    setModifierPrice("0");
  }

  function loadModifierForEdit(
    groupId: string,
    modifier: ProductOptionData["modifierGroups"][number]["modifierGroup"]["modifiers"][number]
  ) {
    setModifierTargetGroupId(groupId);
    setEditingModifierId(modifier.id);
    setModifierName(modifier.name);
    setModifierPrice(String(Number(modifier.price)));
  }

  function resetModifierForm() {
    setModifierTargetGroupId(null);
    setEditingModifierId(null);
    setModifierName("");
    setModifierPrice("0");
  }

  function submitModifier() {
    if (!modifierTargetGroupId) return;
    if (!modifierName.trim()) {
      toast.error("Nama modifier wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", modifierName.trim());
      formData.set("price", modifierPrice || "0");
      if (!editingModifierId) {
        formData.set("modifierGroupId", modifierTargetGroupId);
      }

      const result = editingModifierId
        ? await updateModifier(editingModifierId, formData)
        : await createModifier(formData);

      if (result.success) {
        toast.success(editingModifierId ? "Modifier diperbarui" : "Modifier ditambahkan");
        resetModifierForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeModifier(modifierId: string) {
    if (!window.confirm("Hapus modifier ini?")) return;

    startTransition(async () => {
      const result = await deleteModifier(modifierId);
      if (result.success) {
        toast.success("Modifier dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Kelola Varian & Modifier — {product?.name ?? "Produk"}
          </DialogTitle>
        </DialogHeader>

        {!product ? (
          <p className="text-sm text-muted-foreground">Produk tidak ditemukan.</p>
        ) : (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Varian Produk</h3>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Nama varian"
                  value={variantName}
                  onChange={(event) => setVariantName(event.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Harga"
                  value={variantPrice}
                  onChange={(event) => setVariantPrice(event.target.value)}
                />
                <Input
                  placeholder="SKU (opsional)"
                  value={variantSku}
                  onChange={(event) => setVariantSku(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={submitVariant} disabled={isPending} className="flex-1">
                    {editingVariantId ? "Update" : "Tambah"}
                  </Button>
                  {editingVariantId && (
                    <Button variant="outline" onClick={resetVariantForm}>
                      Batal
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{variant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(variant.price))}
                        {variant.sku ? ` • ${variant.sku}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadVariantForEdit(variant)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeVariant(variant.id)}
                        disabled={isPending}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}

                {product.variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada varian.</p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Modifier Group</h3>

              <div className="grid gap-2 sm:grid-cols-5">
                <Select
                  value={selectedExistingGroupId}
                  onValueChange={(value) => value && setSelectedExistingGroupId(value)}
                >
                  <SelectTrigger className="sm:col-span-4">
                    <SelectValue placeholder="Pilih modifier group yang sudah ada" />
                  </SelectTrigger>
                  <SelectContent>
                    {attachableModifierGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={attachExistingGroup}
                  disabled={isPending || attachableModifierGroups.length === 0}
                >
                  Pasang
                </Button>
              </div>

              {attachableModifierGroups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Semua modifier group yang tersedia sudah terpasang pada produk ini.
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-6">
                <Input
                  className="sm:col-span-2"
                  placeholder="Nama group"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
                <Select
                  value={groupType}
                  onValueChange={(value) =>
                    value && setGroupType(value as "SINGLE" | "MULTIPLE")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MULTIPLE">Multiple</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={groupMinSelect}
                  onChange={(event) => setGroupMinSelect(event.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Max"
                  value={groupMaxSelect}
                  onChange={(event) => setGroupMaxSelect(event.target.value)}
                />
                <div className="flex items-center justify-between gap-2 rounded-md border px-2">
                  <span className="text-xs">Wajib</span>
                  <Switch
                    checked={groupRequired}
                    onCheckedChange={setGroupRequired}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={submitGroup} disabled={isPending}>
                  {editingGroupId ? "Update Group" : "Tambah Group"}
                </Button>
                {editingGroupId && (
                  <Button variant="outline" onClick={resetGroupForm}>
                    Batal
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {product.modifierGroups.map((productGroup) => (
                  <div key={productGroup.id} className="rounded-md border p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{productGroup.modifierGroup.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{productGroup.modifierGroup.type}</Badge>
                          <span>
                            min {productGroup.modifierGroup.minSelect} • max {productGroup.modifierGroup.maxSelect}
                          </span>
                          {productGroup.modifierGroup.isRequired && (
                            <Badge variant="outline">Wajib</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadGroupForEdit(productGroup)}
                          disabled={isPending}
                        >
                          Edit Group
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => unlinkGroup(productGroup)}
                          disabled={isPending}
                        >
                          Lepas Group
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {productGroup.modifierGroup.modifiers.map((modifier) => (
                        <div
                          key={modifier.id}
                          className="flex items-center justify-between rounded border px-2 py-1.5"
                        >
                          <p className="text-sm">
                            {modifier.name}
                            <span className="text-muted-foreground"> • {formatCurrency(Number(modifier.price))}</span>
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                loadModifierForEdit(productGroup.modifierGroup.id, modifier)
                              }
                              disabled={isPending}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeModifier(modifier.id)}
                              disabled={isPending}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      ))}

                      {productGroup.modifierGroup.modifiers.length === 0 && (
                        <p className="text-xs text-muted-foreground">Belum ada modifier.</p>
                      )}
                    </div>

                    {modifierTargetGroupId === productGroup.modifierGroup.id ? (
                      <div className="grid gap-2 sm:grid-cols-4">
                        <Input
                          className="sm:col-span-2"
                          placeholder="Nama modifier"
                          value={modifierName}
                          onChange={(event) => setModifierName(event.target.value)}
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Harga tambahan"
                          value={modifierPrice}
                          onChange={(event) => setModifierPrice(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={submitModifier} disabled={isPending}>
                            {editingModifierId ? "Update" : "Tambah"}
                          </Button>
                          <Button variant="outline" onClick={resetModifierForm}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModifierForm(productGroup.modifierGroup.id)}
                      >
                        Tambah Modifier
                      </Button>
                    )}
                  </div>
                ))}

                {product.modifierGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada modifier group.</p>
                )}
              </div>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
