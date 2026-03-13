import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/dashboard/category-manager";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;
  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Tidak ada cabang yang dipilih.</p>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { branchId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kategori</h1>
          <p className="text-muted-foreground">
            Kelola kategori menu produk
          </p>
        </div>
      </div>
      <CategoryManager
        branchId={branchId}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
        }))}
      />
    </div>
  );
}
