"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { categorySchema, updateCategorySchema } from "@/lib/validations/category";
import type { ActionResult } from "@/lib/utils";
import type { Category } from "@prisma/client";

export async function getCategories(branchId?: string): Promise<Category[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetBranchId = branchId || session.user.branchId;
  if (!targetBranchId) return [];

  return prisma.category.findMany({
    where: { branchId: targetBranchId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "category:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = categorySchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const category = await prisma.category.create({
      data: validated.data,
    });
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat kategori.",
    };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "category:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateCategorySchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: validated.data,
    });
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update kategori.",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "category:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus kategori.",
    };
  }
}
