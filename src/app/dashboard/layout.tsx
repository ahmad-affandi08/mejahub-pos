import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBranch = session.user.branchId
    ? await prisma.branch.findUnique({
        where: { id: session.user.branchId },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DashboardHeader user={session.user} />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar user={session.user} branchName={activeBranch?.name ?? null} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
