import { z } from "zod/v4";

// ============================================================
// Order Item Modifier (for creating order)
// ============================================================
const orderItemModifierSchema = z.object({
  modifierId: z.string().min(1, "Modifier ID wajib"),
  name: z.string().min(1),
  price: z.coerce.number().min(0),
});

// ============================================================
// Order Item (for creating order)
// ============================================================
const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID wajib"),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Minimal 1 item"),
  unitPrice: z.coerce.number().min(0, "Harga harus positif"),
  notes: z.string().optional(),
  modifiers: z.array(orderItemModifierSchema).default([]),
});

const publicOrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID wajib"),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Minimal 1 item"),
  notes: z.string().optional(),
  modifiers: z
    .array(
      z.object({
        modifierId: z.string().min(1, "Modifier ID wajib"),
      })
    )
    .default([]),
});

// ============================================================
// Create Order
// ============================================================
export const createOrderSchema = z.object({
  type: z.enum(["DINE_IN", "TAKEAWAY"]).default("DINE_IN"),
  tableId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Order harus memiliki minimal 1 item"),
  // Discount (optional)
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.coerce.number().min(0).optional(),
});

// ============================================================
// Add Items to Existing Order
// ============================================================
export const addOrderItemsSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
  items: z.array(orderItemSchema).min(1, "Minimal 1 item"),
});

// ============================================================
// Update Order Item Status (for KDS)
// ============================================================
export const updateOrderItemStatusSchema = z.object({
  orderItemId: z.string().min(1),
  status: z.enum(["PENDING", "COOKING", "READY", "SERVED", "CANCELLED"]),
});

// ============================================================
// Cancel / Void Order
// ============================================================
export const cancelOrderSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1, "Alasan pembatalan wajib diisi"),
});

// ============================================================
// Payment
// ============================================================
export const processPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
  method: z.enum([
    "CASH",
    "QRIS",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "E_WALLET",
    "TRANSFER",
  ]),
  amount: z.coerce.number().min(0, "Jumlah pembayaran harus positif"),
  receivedAmount: z.coerce.number().min(0).optional(), // For cash
  reference: z.string().optional(), // External ref (QRIS ID, etc.)
});

// ============================================================
// Split Bill Payment
// ============================================================
export const splitBillPaymentSchema = z.object({
  orderId: z.string().min(1),
  payments: z
    .array(
      z.object({
        method: z.enum([
          "CASH",
          "QRIS",
          "DEBIT_CARD",
          "CREDIT_CARD",
          "E_WALLET",
          "TRANSFER",
        ]),
        amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
        receivedAmount: z.coerce.number().min(0).optional(),
        reference: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 metode pembayaran"),
});

// ============================================================
// Stock Movement
// ============================================================
export const stockMovementSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID wajib"),
  type: z.enum(["IN", "OUT", "WASTE", "ADJUSTMENT"]),
  quantity: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  notes: z.string().optional(),
});

// ============================================================
// Table Transfer
// ============================================================
export const transferTableSchema = z.object({
  orderId: z.string().min(1),
  newTableId: z.string().min(1, "Meja tujuan wajib dipilih"),
});

export const approveQrOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
});

export const rejectQrOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
  reason: z.string().min(3, "Alasan minimal 3 karakter").max(300),
});

export const publicCustomerOrderSchema = z.object({
  branchId: z.string().min(1, "Branch wajib"),
  tableId: z.string().min(1, "Meja wajib"),
  customerName: z.string().min(2, "Nama pelanggan wajib diisi"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(publicOrderItemSchema)
    .min(1, "Order harus memiliki minimal 1 item"),
});

// ============================================================
// Types
// ============================================================
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
export type UpdateOrderItemStatusInput = z.infer<typeof updateOrderItemStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type SplitBillPaymentInput = z.infer<typeof splitBillPaymentSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type TransferTableInput = z.infer<typeof transferTableSchema>;
export type PublicCustomerOrderInput = z.infer<typeof publicCustomerOrderSchema>;
export type ApproveQrOrderInput = z.infer<typeof approveQrOrderSchema>;
export type RejectQrOrderInput = z.infer<typeof rejectQrOrderSchema>;
