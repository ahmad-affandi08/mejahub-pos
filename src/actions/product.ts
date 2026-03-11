"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { productSchema, updateProductSchema } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/utils";
import type { Product } from "@prisma/client";

export async function getProducts(branchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetBranchId = branchId || session.user.branchId;
  if (!targetBranchId) return [];

  return prisma.product.findMany({
    where: { branchId: targetBranchId, isActive: true },
    include: {
      category: true,
      variants: { where: { isActive: true } },
      modifierGroups: {
        include: {
          modifierGroup: {
            include: {
              modifiers: { where: { isActive: true } },
            },
          },
        },
      },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { where: { isActive: true } },
      modifierGroups: {
        include: {
          modifierGroup: {
            include: {
              modifiers: { where: { isActive: true } },
            },
          },
        },
      },
      recipes: {
        include: { ingredient: true },
      },
    },
  });
}

export async function createProduct(
  formData: FormData
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = productSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const product = await prisma.product.create({
      data: validated.data,
    });
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat produk.",
    };
  }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateProductSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: validated.data,
    });
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update produk.",
    };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus produk.",
    };
  }
}

export async function toggleProductAvailability(
  id: string
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable: !product.isAvailable },
    });
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update produk.",
    };
  }
}
