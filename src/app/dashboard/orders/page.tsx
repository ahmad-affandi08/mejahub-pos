import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/actions/product";
import { getOrders, getPendingApprovalOrders } from "@/actions/order";
import prisma from "@/lib/prisma";
import { POSClient } from "@/components/pos/pos-client";
import { PendingQROrders } from "@/components/pos/pending-qr-orders";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;
  if (!branchId) redirect("/dashboard");

  // Fetch data in parallel
  const [products, orders, pendingQrOrders, tables, branch] = await Promise.all([
    getProducts(branchId),
    getOrders({ status: "OPEN" }),
    getPendingApprovalOrders(),
    prisma.table.findMany({
      where: { branchId, isActive: true },
      orderBy: { number: "asc" },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { taxRate: true, serviceRate: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PendingQROrders orders={JSON.parse(JSON.stringify(pendingQrOrders))} />
      <POSClient
        products={JSON.parse(JSON.stringify(products))}
        openOrders={JSON.parse(JSON.stringify(orders))}
        tables={JSON.parse(JSON.stringify(tables))}
        taxRate={Number(branch?.taxRate ?? 10)}
        serviceRate={Number(branch?.serviceRate ?? 5)}
      />
    </div>
  );
}
