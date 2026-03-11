import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function KitchenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen Display System (KDS)</h1>
        <p className="text-muted-foreground">
          Layar dapur untuk melihat dan mengelola pesanan masuk
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-16">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">KDS akan tersedia di Sprint 3</p>
          <p className="text-sm">
            Fitur Kitchen Display System (auto-refresh, station routing, bump
            timer) akan diimplementasikan pada sprint berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
