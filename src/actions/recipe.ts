"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { upsertRecipeSchema, type UpsertRecipeInput } from "@/lib/validations/recipe";
import { logAudit } from "@/lib/audit";

export async function getRecipeDashboardData() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "inventory:manage")) {
    throw new Error("Unauthorized");
  }

  const branchId = session.user.branchId;
  if (!branchId) {
    return { products: [], ingredients: [] };
  }

  const [products, ingredients] = await Promise.all([
    prisma.product.findMany({
      where: { branchId, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        recipes: {
          include: {
            ingredient: true,
          },
          orderBy: { ingredient: { name: "asc" } },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.ingredient.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { products, ingredients };
}

export async function upsertProductRecipe(
  input: UpsertRecipeInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "inventory:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const branchId = session.user.branchId;
  if (!branchId) {
    return { success: false, error: "Branch tidak ditemukan." };
  }

  const validated = upsertRecipeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const existingRecipe = await prisma.recipe.findMany({
      where: { productId: validated.data.productId },
      include: {
        ingredient: { select: { id: true, name: true } },
      },
    });

    const product = await prisma.product.findFirst({
      where: { id: validated.data.productId, branchId, isActive: true },
      select: { id: true, name: true },
    });

    if (!product) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    const ingredientIds = validated.data.items.map((item) => item.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, branchId, isActive: true },
      select: { id: true, name: true },
    });

    if (ingredientIds.length !== ingredients.length) {
      return { success: false, error: "Ada bahan yang tidak valid untuk cabang ini." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({
        where: { productId: validated.data.productId },
      });

      if (validated.data.items.length > 0) {
        await tx.recipe.createMany({
          data: validated.data.items.map((item) => ({
            productId: validated.data.productId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          })),
        });
      }
    });

    await logAudit({
      action: existingRecipe.length > 0 ? "UPDATE" : "CREATE",
      entity: "recipes",
      entityId: validated.data.productId,
      oldData: existingRecipe.map((item) => ({
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        quantity: Number(item.quantity),
      })),
      newData: {
        productId: product.id,
        productName: product.name,
        items: validated.data.items.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      },
      userId: session.user.id,
      branchId,
    });

    revalidatePath("/dashboard/recipes");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan resep.",
    };
  }
}
