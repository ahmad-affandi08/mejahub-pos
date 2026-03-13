"use server";

import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { stockMovementSchema } from "@/lib/validations/order";
import type { Ingredient, StockMovement } from "@prisma/client";

// ============================================================
// GET INGREDIENTS (with stock info)
// ============================================================

export async function getIngredients() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return [];

  return prisma.ingredient.findMany({
    where: { branchId, isActive: true },
    include: {
      recipes: {
        include: { product: { select: { id: true, name: true } } },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getIngredientById(id: string) {
  return prisma.ingredient.findUnique({
    where: { id },
    include: {
      recipes: {
        include: { product: { select: { id: true, name: true } } },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

// ============================================================
// GET LOW STOCK INGREDIENTS
// ============================================================

export async function getLowStockIngredients() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return [];

  // Get all ingredients where currentStock <= minStock
  const ingredients = await prisma.ingredient.findMany({
    where: {
      branchId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return ingredients.filter(
    (i) => Number(i.currentStock) <= Number(i.minStock)
  );
}

// ============================================================
// ADD STOCK MOVEMENT (manual adjustment)
// ============================================================

export async function addStockMovement(input: {
  ingredientId: string;
  type: string;
  quantity: number;
  notes?: string;
}): Promise<ActionResult<StockMovement>> {
  const session = await auth();
  if (
    !session?.user ||
    !hasPermission(session.user.role, "inventory:manage")
  ) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = stockMovementSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;
  const branchId = session.user.branchId;
  if (!branchId) return { success: false, error: "Branch tidak ditemukan." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify ingredient
      const ingredient = await tx.ingredient.findUnique({
        where: { id: data.ingredientId },
      });
      if (!ingredient) throw new Error("Bahan tidak ditemukan.");

      // Update stock based on type
      if (data.type === "IN") {
        await tx.ingredient.update({
          where: { id: data.ingredientId },
          data: { currentStock: { increment: data.quantity } },
        });
      } else if (data.type === "OUT" || data.type === "WASTE") {
        // Validate sufficient stock
        if (Number(ingredient.currentStock) < data.quantity) {
          throw new Error(
            `Stok tidak cukup. Sisa: ${Number(ingredient.currentStock)} ${ingredient.unit}`
          );
        }
        await tx.ingredient.update({
          where: { id: data.ingredientId },
          data: { currentStock: { decrement: data.quantity } },
        });
      } else if (data.type === "ADJUSTMENT") {
        // Direct set (adjustment could be positive or negative)
        // We use the quantity as the new absolute value via increment/decrement
        const diff = data.quantity - Number(ingredient.currentStock);
        if (diff >= 0) {
          await tx.ingredient.update({
            where: { id: data.ingredientId },
            data: { currentStock: { increment: diff } },
          });
        } else {
          await tx.ingredient.update({
            where: { id: data.ingredientId },
            data: { currentStock: { decrement: Math.abs(diff) } },
          });
        }
      }

      // Record movement
      const movement = await tx.stockMovement.create({
        data: {
          type: data.type as StockMovement["type"],
          quantity: data.quantity,
          notes: data.notes,
          ingredientId: data.ingredientId,
          branchId,
        },
      });

      return movement;
    });

    revalidatePath("/dashboard/inventory");

    await logAudit({
      action: "UPDATE",
      entity: "stock_movements",
      entityId: result.id,
      newData: {
        ingredientId: data.ingredientId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
      },
      userId: session.user.id,
      branchId,
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mencatat pergerakan stok.",
    };
  }
}

// ============================================================
// BULK STOCK IN (receiving delivery)
// ============================================================

export async function bulkStockIn(
  items: Array<{
    ingredientId: string;
    quantity: number;
    notes?: string;
  }>
): Promise<ActionResult> {
  const session = await auth();
  if (
    !session?.user ||
    !hasPermission(session.user.role, "inventory:manage")
  ) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const branchId = session.user.branchId;
  if (!branchId) return { success: false, error: "Branch tidak ditemukan." };

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { currentStock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            type: "IN",
            quantity: item.quantity,
            notes: item.notes || "Penerimaan stok masuk",
            ingredientId: item.ingredientId,
            branchId,
          },
        });
      }
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal input stok masuk.",
    };
  }
}

// ============================================================
// CREATE / UPDATE INGREDIENT
// ============================================================

export async function createIngredient(input: {
  name: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  costPerUnit?: number;
}): Promise<ActionResult<Ingredient>> {
  const session = await auth();
  if (
    !session?.user ||
    !hasPermission(session.user.role, "inventory:manage")
  ) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const branchId = session.user.branchId;
  if (!branchId) return { success: false, error: "Branch tidak ditemukan." };

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        name: input.name,
        unit: input.unit as Ingredient["unit"],
        currentStock: input.currentStock || 0,
        minStock: input.minStock || 0,
        costPerUnit: input.costPerUnit || 0,
        branchId,
      },
    });

    revalidatePath("/dashboard/inventory");

    await logAudit({
      action: "CREATE",
      entity: "ingredients",
      entityId: ingredient.id,
      newData: {
        name: ingredient.name,
        unit: ingredient.unit,
        minStock: Number(ingredient.minStock),
      },
      userId: session.user.id,
      branchId,
    });

    return { success: true, data: ingredient };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menambah bahan.",
    };
  }
}

export async function updateIngredient(
  id: string,
  input: {
    name?: string;
    unit?: string;
    minStock?: number;
    costPerUnit?: number;
  }
): Promise<ActionResult<Ingredient>> {
  const session = await auth();
  if (
    !session?.user ||
    !hasPermission(session.user.role, "inventory:manage")
  ) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.unit) data.unit = input.unit;
    if (input.minStock !== undefined) data.minStock = input.minStock;
    if (input.costPerUnit !== undefined) data.costPerUnit = input.costPerUnit;

    const previous = await prisma.ingredient.findUnique({ where: { id } });
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/inventory");

    await logAudit({
      action: "UPDATE",
      entity: "ingredients",
      entityId: ingredient.id,
      oldData: previous,
      newData: ingredient,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: ingredient };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal update bahan.",
    };
  }
}

// ============================================================
// GET STOCK MOVEMENT HISTORY
// ============================================================

export async function getStockMovements(ingredientId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return [];

  const where: Record<string, unknown> = { branchId };
  if (ingredientId) where.ingredientId = ingredientId;

  return prisma.stockMovement.findMany({
    where,
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
