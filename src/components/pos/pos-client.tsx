"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { OpenOrdersList } from "@/components/pos/open-orders-list";
import { PendingQROrders } from "@/components/pos/pending-qr-orders";
import { useSocket } from "@/hooks/use-socket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList, QrCode } from "lucide-react";

interface POSClientProps {
  products: ProductWithRelations[];
  openOrders: OrderWithRelations[];
  pendingQrOrders: PendingQrOrder[];
  tables: TableData[];
  branchId: string;
  taxRate: number;
  serviceRate: number;
}

interface PendingQrOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  customerName: string | null;
  table: { id: string; number: number; name: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    product: { id: string; name: string };
  }>;
}

// Type definitions
export interface ProductWithRelations {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  image: string | null;
  station: string;
  isAvailable: boolean;
  categoryId: string;
  category: { id: string; name: string };
  variants: Array<{
    id: string;
    name: string;
    price: number | string;
    isActive: boolean;
  }>;
  modifierGroups: Array<{
    modifierGroup: {
      id: string;
      name: string;
      type: string;
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      modifiers: Array<{
        id: string;
        name: string;
        price: number | string;
        isActive: boolean;
      }>;
    };
  }>;
}

export interface OrderWithRelations {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: number | string;
  taxAmount: number | string;
  serviceAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  customerName: string | null;
  tableId: string | null;
  createdAt: string;
  table: { id: string; number: number; name: string | null } | null;
  user: { id: string; name: string; role: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    subtotal: number | string;
    notes: string | null;
    status: string;
    product: { id: string; name: string };
    variant: { id: string; name: string } | null;
    modifiers: Array<{
      id: string;
      name: string;
      price: number | string;
    }>;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number | string;
    status: string;
  }>;
}

export interface TableData {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: string;
}

export function POSClient({
  products,
  openOrders,
  pendingQrOrders,
  tables,
  branchId,
  taxRate,
  serviceRate,
}: POSClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("new-order");
  const { setTaxRate, setServiceRate } = useCartStore();
  const { on } = useSocket(branchId);

  // Set branch tax/service rates on mount
  useEffect(() => {
    setTaxRate(taxRate);
    setServiceRate(serviceRate);
  }, [taxRate, serviceRate, setTaxRate, setServiceRate]);

  useEffect(() => {
    const unsubscribers = [
      on("new-customer-order", () => router.refresh()),
      on("order-updated", () => router.refresh()),
      on("new-order", () => router.refresh()),
      on("table-status-change", () => router.refresh()),
      on("payment-completed", () => router.refresh()),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [on, router]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="h-full min-h-0 min-w-0 pr-100">
        {/* Left: Product Selection / Orders List */}
        <div className="h-full min-h-0 min-w-0 overflow-hidden border-r">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
          >
            <div className="border-b px-4 pt-2">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="new-order" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Order Baru
                </TabsTrigger>
                <TabsTrigger value="qr-approval" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Menunggu Approval ({pendingQrOrders.length})
                </TabsTrigger>
                <TabsTrigger value="open-orders" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Pesanan Aktif ({openOrders.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new-order" className="m-0 min-h-0 w-full min-w-0 flex-1 overflow-hidden">
              <ProductGrid products={products} />
            </TabsContent>

            <TabsContent value="qr-approval" className="m-0 min-h-0 w-full min-w-0 flex-1 overflow-auto p-4">
              {pendingQrOrders.length > 0 ? (
                <PendingQROrders orders={pendingQrOrders} />
              ) : (
                <div className="flex h-full min-h-60 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Tidak ada pesanan QR yang menunggu approval.
                </div>
              )}
            </TabsContent>

            <TabsContent value="open-orders" className="m-0 min-h-0 w-full min-w-0 flex-1 overflow-auto p-4">
              <OpenOrdersList orders={openOrders} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-100 overflow-hidden border-l bg-background">
        <CartPanel tables={tables} />
      </div>
    </div>
  );
}
