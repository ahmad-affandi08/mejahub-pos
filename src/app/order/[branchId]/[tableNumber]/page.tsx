import { notFound } from "next/navigation";
import { getPublicMenu, getPublicTable } from "@/actions/customer-order";
import { CustomerOrderClient } from "@/components/customer/customer-order-client";

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ branchId: string; tableNumber: string }>;
}) {
  const { branchId, tableNumber } = await params;
  const tableNum = parseInt(tableNumber, 10);
  if (isNaN(tableNum)) notFound();

  const [menuData, table] = await Promise.all([
    getPublicMenu(branchId),
    getPublicTable(branchId, tableNum),
  ]);

  if (!menuData || !table) notFound();

  return (
    <CustomerOrderClient
      branch={menuData.branch}
      categories={menuData.categories}
      table={table}
    />
  );
}
