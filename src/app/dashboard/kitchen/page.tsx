import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { KDSClient } from "@/components/kitchen/kds-client";

export default async function KitchenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;
  if (!branchId) redirect("/dashboard");

  // Get all pending/cooking order items for this branch
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { branchId, status: { in: ["OPEN", "PAID"] } },
      status: { in: ["PENDING", "COOKING", "READY"] },
    },
    include: {
      product: { select: { id: true, name: true } },
      variant: { select: { id: true, name: true } },
      modifiers: { select: { id: true, name: true, price: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          type: true,
          tableId: true,
          table: { select: { number: true, name: true } },
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <KDSClient
      orderItems={JSON.parse(JSON.stringify(orderItems))}
      branchId={branchId}
    />
  );
}
