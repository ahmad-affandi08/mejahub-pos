import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUPER_ADMIN: "destructive",
  BRANCH_MANAGER: "default",
  CASHIER: "secondary",
  WAITER: "secondary",
  KITCHEN_STAFF: "outline",
  BAR_STAFF: "outline",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const where: Record<string, unknown> = {};
  if (session.user.role !== "SUPER_ADMIN" && session.user.branchId) {
    where.branchId = session.user.branchId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      branch: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengguna</h1>
          <p className="text-muted-foreground">
            Kelola staff dan assign role
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna ({users.length})</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[user.role] || "outline"}>
                      {user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.branch?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Aktif" : "Non-aktif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
