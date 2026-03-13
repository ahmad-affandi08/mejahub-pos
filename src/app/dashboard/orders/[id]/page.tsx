import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/actions/order";
import { OrderDetail } from "@/components/pos/order-detail";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const branchId = session.user.branchId;
  const tables = branchId
    ? await prisma.table.findMany({
        where: { branchId, isActive: true },
        select: {
          id: true,
          number: true,
          name: true,
          status: true,
        },
        orderBy: { number: "asc" },
      })
    : [];

  const permissions = {
    canProcessPayment: hasPermission(session.user.role, "payment:process"),
    canTransferTable: hasPermission(session.user.role, "table:manage"),
    canRefundPayment: hasPermission(session.user.role, "payment:refund"),
  };

  return (
    <OrderDetail
      order={JSON.parse(JSON.stringify(order))}
      tables={JSON.parse(JSON.stringify(tables))}
      permissions={permissions}
    />
  );
}
