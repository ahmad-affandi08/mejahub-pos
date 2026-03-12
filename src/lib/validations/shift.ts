import { z } from "zod/v4";

// ============================================================
// Open Shift
// ============================================================
export const openShiftSchema = z.object({
  openingCash: z.coerce
    .number()
    .min(0, "Modal awal tidak boleh negatif"),
  notes: z.string().optional(),
});

// ============================================================
// Close Shift (Blind Close - cashier inputs closing cash)
// ============================================================
export const closeShiftSchema = z.object({
  shiftId: z.string().min(1, "Shift ID wajib"),
  closingCash: z.coerce
    .number()
    .min(0, "Kas akhir tidak boleh negatif"),
  notes: z.string().optional(),
});

// ============================================================
// Cash Drawer Transaction
// ============================================================
export const cashDrawerTransactionSchema = z.object({
  shiftId: z.string().min(1, "Shift ID wajib"),
  type: z.enum(["CASH_IN", "CASH_OUT"]),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  reason: z.string().min(1, "Alasan wajib diisi"),
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
export type CashDrawerTransactionInput = z.infer<typeof cashDrawerTransactionSchema>;
