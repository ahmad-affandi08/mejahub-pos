import { create } from "zustand";

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
  orderType: "DINE_IN" | "TAKEAWAY";
  customerName: string;
  customerPhone: string;
  notes: string;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemNotes: (index: number, notes: string) => void;
  setTableId: (tableId: string | null) => void;
  setOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemTotal: (item: CartItem) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  orderType: "DINE_IN",
  customerName: "",
  customerPhone: "",
  notes: "",

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

  setTableId: (tableId) => set({ tableId }),
  setOrderType: (orderType) => set({ orderType }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      tableId: null,
      orderType: "DINE_IN",
      customerName: "",
      customerPhone: "",
      notes: "",
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + get().getItemTotal(item), 0);
  },

  getItemTotal: (item) => {
    const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price, 0);
    return (item.price + modifiersTotal) * item.quantity;
  },
}));
