import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const branchId = session?.user?.branchId;

  // Fetch dashboard stats
  const [
    tablesCount,
    productsCount,
    todayOrders,
    todaySales,
    activeUsers,
    lowStockIngredients,
  ] = await Promise.all([
    prisma.table.count({
      where: { branchId: branchId || undefined, isActive: true },
    }),
    prisma.product.count({
      where: { branchId: branchId || undefined, isActive: true },
    }),
    prisma.order.count({
      where: {
        branchId: branchId || undefined,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        branchId: branchId || undefined,
        status: "PAID",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.user.count({
      where: { branchId: branchId || undefined, isActive: true },
    }),
    prisma.ingredient.count({
      where: {
        branchId: branchId || undefined,
        isActive: true,
        currentStock: { lte: prisma.ingredient.fields.minStock },
      },
    }).catch(() => 0), // Gracefully handle if comparison fails
  ]);

  const salesTotal = Number(todaySales._sum.totalAmount ?? 0);

  // Get occupied tables
  const occupiedTables = await prisma.table.count({
    where: {
      branchId: branchId || undefined,
      isActive: true,
      status: { not: "AVAILABLE" },
    },
  });

  const stats = [
    {
      title: "Total Meja",
      value: `${occupiedTables}/${tablesCount}`,
      description: "Meja terisi / total",
      icon: Grid3X3,
      color: "text-blue-500",
    },
    {
      title: "Produk Aktif",
      value: productsCount.toString(),
      description: "Menu tersedia",
      icon: UtensilsCrossed,
      color: "text-green-500",
    },
    {
      title: "Pesanan Hari Ini",
      value: todayOrders.toString(),
      description: "Total pesanan",
      icon: ClipboardList,
      color: "text-purple-500",
    },
    {
      title: "Penjualan Hari Ini",
      value: formatCurrency(salesTotal),
      description: "Total revenue",
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Tim Aktif",
      value: activeUsers.toString(),
      description: "Staff online",
      icon: Users,
      color: "text-orange-500",
    },
    {
      title: "Stok Rendah",
      value: lowStockIngredients.toString(),
      description: "Perlu restock",
      icon: AlertTriangle,
      color: lowStockIngredients > 0 ? "text-red-500" : "text-gray-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali, {session?.user?.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>
            Pintasan ke fitur yang sering digunakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Lihat Meja
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Buat Pesanan
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent"
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Kelola Produk
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
