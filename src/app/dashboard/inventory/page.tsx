import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getIngredients, getLowStockIngredients } from "@/actions/stock";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [ingredients, lowStock] = await Promise.all([
    getIngredients(),
    getLowStockIngredients(),
  ]);

  return (
    <InventoryClient
      ingredients={JSON.parse(JSON.stringify(ingredients))}
      lowStockCount={lowStock.length}
    />
  );
}
