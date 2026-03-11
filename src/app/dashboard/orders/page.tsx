import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pesanan</h1>
        <p className="text-muted-foreground">
          Kelola pesanan pelanggan dan pembayaran
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-16">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Modul Pesanan akan tersedia di Sprint 2</p>
          <p className="text-sm">
            Cart Engine, kalkulasi pajak/diskon, proses order akan
            diimplementasikan pada sprint berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
