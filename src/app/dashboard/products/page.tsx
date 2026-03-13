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

  const [products, categories, modifierGroups] = await Promise.all([
    prisma.product.findMany({
      where: { branchId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: { where: { isActive: true } },
              },
            },
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.category.findMany({
      where: { branchId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.modifierGroup.findMany({
      include: {
        modifiers: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    station: product.station,
    isAvailable: product.isAvailable,
    sku: product.sku,
    category: {
      id: product.category.id,
      name: product.category.name,
    },
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      sku: variant.sku,
    })),
    modifierGroups: product.modifierGroups.map((productGroup) => ({
      id: productGroup.id,
      modifierGroupId: productGroup.modifierGroupId,
      modifierGroup: {
        id: productGroup.modifierGroup.id,
        name: productGroup.modifierGroup.name,
        type: productGroup.modifierGroup.type,
        isRequired: productGroup.modifierGroup.isRequired,
        minSelect: productGroup.modifierGroup.minSelect,
        maxSelect: productGroup.modifierGroup.maxSelect,
        modifiers: productGroup.modifierGroup.modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          price: Number(modifier.price),
        })),
      },
    })),
  }));

  const normalizedModifierGroups = modifierGroups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    modifiers: group.modifiers.map((modifier) => ({
      id: modifier.id,
      name: modifier.name,
      price: Number(modifier.price),
    })),
  }));

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

      <ProductList
        products={normalizedProducts}
        categories={categories}
        branchId={branchId}
        availableModifierGroups={normalizedModifierGroups}
      />
    </div>
  );
}
