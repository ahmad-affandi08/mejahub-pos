import { z } from "zod/v4";

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  branchId: z.string().min(1, "Branch wajib dipilih"),
});

export const updateCategorySchema = categorySchema.partial().omit({
  branchId: true,
});

export type CategoryInput = z.infer<typeof categorySchema>;
