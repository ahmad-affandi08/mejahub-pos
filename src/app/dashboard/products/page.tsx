import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductList } from "@/components/dashboard/product-list";

export default async function ProductsPage() {
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

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { branchId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.category.findMany({
      where: { branchId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produk</h1>
          <p className="text-muted-foreground">
            Kelola menu dan produk untuk dijual
          </p>
        </div>
      </div>

      <ProductList products={products} categories={categories} />
    </div>
  );
}
