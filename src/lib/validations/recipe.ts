import { z } from "zod/v4";

export const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Bahan wajib dipilih"),
  quantity: z.coerce.number().positive("Jumlah bahan harus lebih dari 0"),
});

export const upsertRecipeSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  items: z.array(recipeItemSchema),
});

export type UpsertRecipeInput = z.infer<typeof upsertRecipeSchema>;
