"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { branchSchema, updateBranchSchema } from "@/lib/validations/branch";
import type { ActionResult } from "@/lib/utils";
import type { Branch } from "@prisma/client";

export async function getBranches(): Promise<Branch[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.role === "SUPER_ADMIN") {
    return prisma.branch.findMany({ orderBy: { name: "asc" } });
  }

  if (session.user.branchId) {
    return prisma.branch.findMany({
      where: { id: session.user.branchId },
    });
  }

  return [];
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.branch.findUnique({ where: { id } });
}

export async function createBranch(
  formData: FormData
): Promise<ActionResult<Branch>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "branch:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = branchSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const branch = await prisma.branch.create({
      data: validated.data,
    });
    return { success: true, data: branch };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat cabang.",
    };
  }
}

export async function updateBranch(
  id: string,
  formData: FormData
): Promise<ActionResult<Branch>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "branch:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateBranchSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: validated.data,
    });
    return { success: true, data: branch };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update cabang.",
    };
  }
}

export async function deleteBranch(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "branch:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus cabang.",
    };
  }
}
