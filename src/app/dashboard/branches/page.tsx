import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BranchManager } from "@/components/dashboard/branch-manager";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!hasPermission(session.user.role, "branch:manage")) {
    redirect("/dashboard");
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cabang</h1>
          <p className="text-muted-foreground">
            Kelola data cabang, pajak, dan service charge
          </p>
        </div>
      </div>

      <BranchManager
        branches={branches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          taxRate: Number(branch.taxRate),
          serviceRate: Number(branch.serviceRate),
          isActive: branch.isActive,
        }))}
      />
    </div>
  );
}
