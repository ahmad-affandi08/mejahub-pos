import { z } from "zod/v4";

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  image: z.string().optional(),
  sku: z.string().optional(),
  station: z.enum(["KITCHEN", "BAR"]).default("KITCHEN"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  branchId: z.string().min(1, "Branch wajib dipilih"),
});

export const updateProductSchema = productSchema.partial().omit({
  branchId: true,
});

export const productVariantSchema = z.object({
  name: z.string().min(1, "Nama variant wajib diisi"),
  price: z.coerce.number().min(0),
  sku: z.string().optional(),
  productId: z.string().min(1),
});

export const modifierGroupSchema = z.object({
  name: z.string().min(1, "Nama modifier group wajib diisi"),
  type: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  isRequired: z.boolean().default(false),
  minSelect: z.coerce.number().int().min(0).default(0),
  maxSelect: z.coerce.number().int().min(1).default(1),
});

export const modifierSchema = z.object({
  name: z.string().min(1, "Nama modifier wajib diisi"),
  price: z.coerce.number().min(0).default(0),
  modifierGroupId: z.string().min(1),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;
export type ModifierInput = z.infer<typeof modifierSchema>;
