import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
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

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer transition-all hover:shadow-md"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  #{category.sortOrder}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {category.description && (
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              )}
              <p className="mt-2 text-sm font-medium">
                {category._count.products} produk
              </p>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Belum ada kategori. Mulai dengan menambahkan kategori baru.
          </div>
        )}
      </div>
    </div>
  );
}
