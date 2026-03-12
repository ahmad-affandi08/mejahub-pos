"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { OpenOrdersList } from "./open-orders-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList } from "lucide-react";

interface POSClientProps {
  products: ProductWithRelations[];
  openOrders: OrderWithRelations[];
  tables: TableData[];
  taxRate: number;
  serviceRate: number;
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
  tables,
  taxRate,
  serviceRate,
}: POSClientProps) {
  const [activeTab, setActiveTab] = useState("new-order");
  const { setTaxRate, setServiceRate } = useCartStore();

  // Set branch tax/service rates on mount
  useEffect(() => {
    setTaxRate(taxRate);
    setServiceRate(serviceRate);
  }, [taxRate, serviceRate, setTaxRate, setServiceRate]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6">
      {/* Left: Product Selection / Orders List */}
      <div className="flex-1 overflow-hidden border-r">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4 pt-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="new-order" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order Baru
              </TabsTrigger>
              <TabsTrigger value="open-orders" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Pesanan Aktif ({openOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new-order" className="flex-1 overflow-hidden m-0">
            <ProductGrid products={products} />
          </TabsContent>

          <TabsContent value="open-orders" className="flex-1 overflow-auto m-0 p-4">
            <OpenOrdersList orders={openOrders} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-[400px] shrink-0">
        <CartPanel tables={tables} />
      </div>
    </div>
  );
}
