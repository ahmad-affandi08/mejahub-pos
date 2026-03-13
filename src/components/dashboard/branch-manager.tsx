"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBranch, deleteBranch, updateBranch } from "@/actions/branch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BranchItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  taxRate: number;
  serviceRate: number;
  isActive: boolean;
}

interface BranchManagerProps {
  branches: BranchItem[];
}

export function BranchManager({ branches }: BranchManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [serviceRate, setServiceRate] = useState("5");

  function openCreateDialog() {
    setEditingBranch(null);
    setName("");
    setAddress("");
    setPhone("");
    setTaxRate("10");
    setServiceRate("5");
    setDialogOpen(true);
  }

  function openEditDialog(branch: BranchItem) {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setTaxRate(String(branch.taxRate));
    setServiceRate(String(branch.serviceRate));
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Nama cabang wajib diisi");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      if (address.trim()) {
        formData.set("address", address.trim());
      }
      if (phone.trim()) {
        formData.set("phone", phone.trim());
      }
      formData.set("taxRate", taxRate || "10");
      formData.set("serviceRate", serviceRate || "5");

      const result = editingBranch
        ? await updateBranch(editingBranch.id, formData)
        : await createBranch(formData);

      if (result.success) {
        toast.success(editingBranch ? "Cabang diperbarui" : "Cabang ditambahkan");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(branch: BranchItem) {
    if (!window.confirm(`Nonaktifkan cabang ${branch.name}?`)) return;

    startTransition(async () => {
      const result = await deleteBranch(branch.id);
      if (result.success) {
        toast.success("Cabang dinonaktifkan");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>Tambah Cabang</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{branch.name}</CardTitle>
                <Badge variant={branch.isActive ? "default" : "secondary"}>
                  {branch.isActive ? "Aktif" : "Non-aktif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {branch.address || "Tanpa alamat"}
              </p>
              <div className="space-y-1 text-sm">
                <p>Telepon: {branch.phone || "-"}</p>
                <p>Pajak: {branch.taxRate}%</p>
                <p>Service: {branch.serviceRate}%</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(branch)}
                  disabled={isPending}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(branch)}
                  disabled={isPending || !branch.isActive}
                >
                  Nonaktifkan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Cabang" : "Tambah Cabang"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">Nama Cabang</p>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Alamat</p>
              <Textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={3}
              />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Telepon</p>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Pajak (%)</p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Service (%)</p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={serviceRate}
                  onChange={(event) => setServiceRate(event.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
