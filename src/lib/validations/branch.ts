import { z } from "zod/v4";

export const branchSchema = z.object({
  name: z.string().min(2, "Nama cabang minimal 2 karakter"),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(10),
  serviceRate: z.coerce.number().min(0).max(100).default(5),
});

export const updateBranchSchema = branchSchema.partial();

export type BranchInput = z.infer<typeof branchSchema>;
