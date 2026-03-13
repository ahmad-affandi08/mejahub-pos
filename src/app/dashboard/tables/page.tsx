import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TableGrid } from "@/components/dashboard/table-grid";

export default async function TablesPage() {
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

  const rawTables = await prisma.table.findMany({
    where: { branchId, isActive: true },
    include: {
      orders: {
        where: { status: "OPEN" },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          items: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const tables = rawTables.map((table) => ({
    ...table,
    orders: table.orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Meja</h1>
          <p className="text-muted-foreground">
            Peta meja interaktif dan status real-time
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Kosong</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Terisi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Menunggu Makanan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Minta Bill</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span>Reserved</span>
        </div>
      </div>

      <TableGrid tables={tables} branchId={branchId} />
    </div>
  );
}
