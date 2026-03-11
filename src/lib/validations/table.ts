import { z } from "zod/v4";

export const tableSchema = z.object({
  number: z.coerce.number().int().min(1, "Nomor meja minimal 1"),
  name: z.string().optional(),
  capacity: z.coerce.number().int().min(1).default(4),
  positionX: z.coerce.number().int().default(0),
  positionY: z.coerce.number().int().default(0),
  branchId: z.string().min(1, "Branch wajib dipilih"),
});

export const updateTableSchema = tableSchema.partial().omit({
  branchId: true,
});

export const updateTableStatusSchema = z.object({
  status: z.enum([
    "AVAILABLE",
    "OCCUPIED",
    "WAITING_FOOD",
    "REQUESTING_BILL",
    "RESERVED",
  ]),
});

export type TableInput = z.infer<typeof tableSchema>;
export type UpdateTableStatusInput = z.infer<typeof updateTableStatusSchema>;
