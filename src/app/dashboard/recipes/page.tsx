import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getRecipeDashboardData } from "@/actions/recipe";
import { RecipeManager } from "@/components/recipes/recipe-manager";

export default async function RecipesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "inventory:manage")) {
    redirect("/dashboard");
  }

  const data = await getRecipeDashboardData();

  return (
    <RecipeManager
      products={JSON.parse(JSON.stringify(data.products))}
      ingredients={JSON.parse(JSON.stringify(data.ingredients))}
    />
  );
}
