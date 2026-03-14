import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { WhatsAppServiceSettings } from "@/components/dashboard/whatsapp-service-settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "settings:manage")) {
    redirect("/dashboard");
  }

  const branches = await prisma.branch.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (branches.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Belum ada cabang aktif untuk konfigurasi.</p>
      </div>
    );
  }

  const defaultBranchId =
    session.user.branchId && branches.some((branch) => branch.id === session.user.branchId)
      ? session.user.branchId
      : branches[0].id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Konfigurasi service WhatsApp untuk pengiriman struk pelanggan.
        </p>
      </div>

      <WhatsAppServiceSettings
        branches={branches}
        defaultBranchId={defaultBranchId}
      />
    </div>
  );
}
