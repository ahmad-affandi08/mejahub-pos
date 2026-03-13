"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
import { createUser, toggleUserActive, updateUser } from "@/actions/user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  branchId: string | null;
  branchName: string | null;
}

interface BranchItem {
  id: string;
  name: string;
}

interface UserManagerProps {
  users: UserItem[];
  branches: BranchItem[];
  currentRole: UserRole;
  currentBranchId: string | null;
}

const roleBadgeVariant: Record<
  UserRole,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SUPER_ADMIN: "destructive",
  BRANCH_MANAGER: "default",
  CASHIER: "secondary",
  WAITER: "secondary",
  KITCHEN_STAFF: "outline",
  BAR_STAFF: "outline",
};

const roleOptions: UserRole[] = [
  "SUPER_ADMIN",
  "BRANCH_MANAGER",
  "CASHIER",
  "WAITER",
  "KITCHEN_STAFF",
  "BAR_STAFF",
];

export function UserManager({
  users,
  branches,
  currentRole,
  currentBranchId,
}: UserManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CASHIER");
  const [branchId, setBranchId] = useState("");
  const [pin, setPin] = useState("");

  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  function openCreateDialog() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("CASHIER");
    setBranchId(currentBranchId ?? branches[0]?.id ?? "");
    setPin("");
    setDialogOpen(true);
  }

  function openEditDialog(user: UserItem) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setBranchId(user.branchId ?? currentBranchId ?? branches[0]?.id ?? "");
    setPin("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    if (!editingUser && password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("email", email.trim().toLowerCase());
      formData.set("role", role);

      const targetBranchId = isSuperAdmin ? branchId : currentBranchId;
      if (targetBranchId) {
        formData.set("branchId", targetBranchId);
      }

      if (pin.trim()) {
        formData.set("pin", pin.trim());
      }

      if (password.trim()) {
        formData.set("password", password.trim());
      }

      const result = editingUser
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData);

      if (result.success) {
        toast.success(editingUser ? "Pengguna diperbarui" : "Pengguna ditambahkan");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggleActive(user: UserItem) {
    startTransition(async () => {
      const result = await toggleUserActive(user.id);
      if (result.success) {
        toast.success(user.isActive ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Daftar Pengguna ({users.length})</CardTitle>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama/email..."
              className="w-full sm:w-64"
            />
            <Button onClick={openCreateDialog}>Tambah Pengguna</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant[user.role]}>
                    {user.role.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>{user.branchName ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Aktif" : "Non-aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                      disabled={isPending}
                    >
                      {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Tidak ada pengguna ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">Nama</p>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Email</p>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">
                {editingUser ? "Password Baru (opsional)" : "Password"}
              </p>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Role</p>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {roleOption.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">PIN (opsional)</p>
                <Input
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="4-6 digit"
                />
              </div>
            </div>

            {isSuperAdmin && (
              <div>
                <p className="mb-1 text-sm font-medium">Cabang</p>
                <Select
                  value={branchId}
                  onValueChange={(value) => value && setBranchId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
    </Card>
  );
}
