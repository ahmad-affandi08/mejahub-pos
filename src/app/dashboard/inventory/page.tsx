import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventori</h1>
        <p className="text-muted-foreground">
          Kelola stok bahan baku dan resep (Bill of Materials)
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-16">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Modul Inventori lanjutan akan tersedia di Sprint 4</p>
          <p className="text-sm">
            Bill of Materials, resep, wastage log, dan low stock alerts akan
            diimplementasikan pada sprint berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
