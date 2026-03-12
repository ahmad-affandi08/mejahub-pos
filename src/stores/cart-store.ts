import { create } from "zustand";
import {
  calculateOrderTotal,
  type DiscountConfig,
  type OrderCalculation,
} from "@/lib/calculations";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers: {
    modifierId: string;
    name: string;
    price: number;
  }[];
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  tableName: string | null;
  orderType: "DINE_IN" | "TAKEAWAY";
  customerName: string;
  customerPhone: string;
  notes: string;

  // Tax & Discount
  taxRate: number; // e.g., 10 for 10%
  serviceRate: number; // e.g., 5 for 5%
  discount: DiscountConfig | null;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemNotes: (index: number, notes: string) => void;
  setTableId: (tableId: string | null, tableName?: string | null) => void;
  setOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setNotes: (notes: string) => void;
  setTaxRate: (rate: number) => void;
  setServiceRate: (rate: number) => void;
  setDiscount: (discount: DiscountConfig | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemTotal: (item: CartItem) => number;
  getOrderCalculation: () => OrderCalculation;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  tableName: null,
  orderType: "DINE_IN",
  customerName: "",
  customerPhone: "",
  notes: "",
  taxRate: 10,
  serviceRate: 5,
  discount: null,

  addItem: (item) => {
    set((state) => {
      // Check if same product+variant+modifiers already exists
      const existingIndex = state.items.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId &&
          JSON.stringify(i.modifiers.map((m) => m.modifierId).sort()) ===
            JSON.stringify(item.modifiers.map((m) => m.modifierId).sort())
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
        };
        return { items: newItems };
      }

      return { items: [...state.items, item] };
    });
  },

  removeItem: (index) => {
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    }));
  },

  updateQuantity: (index, quantity) => {
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    set((state) => {
      const newItems = [...state.items];
      newItems[index] = { ...newItems[index], quantity };
      return { items: newItems };
    });
  },

  updateItemNotes: (index, notes) => {
    set((state) => {
      const newItems = [...state.items];
      newItems[index] = { ...newItems[index], notes };
      return { items: newItems };
    });
  },

  setTableId: (tableId, tableName) => set({ tableId, tableName: tableName ?? null }),
  setOrderType: (orderType) => set({ orderType }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setNotes: (notes) => set({ notes }),
  setTaxRate: (taxRate) => set({ taxRate }),
  setServiceRate: (serviceRate) => set({ serviceRate }),
  setDiscount: (discount) => set({ discount }),

  clearCart: () =>
    set({
      items: [],
      tableId: null,
      tableName: null,
      orderType: "DINE_IN",
      customerName: "",
      customerPhone: "",
      notes: "",
      discount: null,
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + get().getItemTotal(item), 0);
  },

  getItemTotal: (item) => {
    const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price, 0);
    return (item.price + modifiersTotal) * item.quantity;
  },

  getOrderCalculation: () => {
    const { items, taxRate, serviceRate, discount } = get();
    const lineItems = items.map((item) => ({
      unitPrice: item.price,
      quantity: item.quantity,
      modifierTotal: item.modifiers.reduce((sum, m) => sum + m.price, 0),
    }));
    return calculateOrderTotal(
      lineItems,
      taxRate,
      serviceRate,
      discount ?? undefined
    );
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
