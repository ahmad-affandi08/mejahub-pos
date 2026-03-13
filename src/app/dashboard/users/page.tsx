import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserManager } from "@/components/dashboard/user-manager";

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
      branchId: true,
      createdAt: true,
      branch: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const branches = await prisma.branch.findMany({
    where: {
      isActive: true,
      ...(session.user.role === "SUPER_ADMIN"
        ? {}
        : session.user.branchId
          ? { id: session.user.branchId }
          : { id: "" }),
    },
    select: { id: true, name: true },
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
      <UserManager
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          branchId: user.branchId,
          branchName: user.branch?.name ?? null,
        }))}
        branches={branches}
        currentRole={session.user.role}
        currentBranchId={session.user.branchId}
      />
    </div>
  );
}
