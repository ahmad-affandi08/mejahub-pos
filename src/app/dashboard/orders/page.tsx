import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/actions/product";
import { getOrders, getPendingApprovalOrders } from "@/actions/order";
import prisma from "@/lib/prisma";
import { POSClient } from "@/components/pos/pos-client";

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

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image,
    station: product.station,
    isAvailable: product.isAvailable,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
    },
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      isActive: variant.isActive,
    })),
    modifierGroups: product.modifierGroups.map((productModifierGroup) => ({
      modifierGroup: {
        id: productModifierGroup.modifierGroup.id,
        name: productModifierGroup.modifierGroup.name,
        type: productModifierGroup.modifierGroup.type,
        isRequired: productModifierGroup.modifierGroup.isRequired,
        minSelect: productModifierGroup.modifierGroup.minSelect,
        maxSelect: productModifierGroup.modifierGroup.maxSelect,
        modifiers: productModifierGroup.modifierGroup.modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          price: Number(modifier.price),
          isActive: modifier.isActive,
        })),
      },
    })),
  }));

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <POSClient
        products={normalizedProducts}
        openOrders={JSON.parse(JSON.stringify(orders))}
        pendingQrOrders={JSON.parse(JSON.stringify(pendingQrOrders))}
        tables={JSON.parse(JSON.stringify(tables))}
        branchId={branchId}
        taxRate={Number(branch?.taxRate ?? 10)}
        serviceRate={Number(branch?.serviceRate ?? 5)}
      />
    </div>
  );
}
