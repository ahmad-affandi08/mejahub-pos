"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { branchSchema, updateBranchSchema } from "@/lib/validations/branch";
import type { ActionResult } from "@/lib/utils";
import type { Branch } from "@prisma/client";

type BranchPayload = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  taxRate: number;
  serviceRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function serializeBranch(branch: Branch): BranchPayload {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    taxRate: Number(branch.taxRate),
    serviceRate: Number(branch.serviceRate),
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  };
}

export async function getBranches(): Promise<BranchPayload[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (session.user.role === "SUPER_ADMIN") {
    const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
    return branches.map(serializeBranch);
  }

  if (session.user.branchId) {
    const branches = await prisma.branch.findMany({
      where: { id: session.user.branchId },
    });
    return branches.map(serializeBranch);
  }

  return [];
}

export async function getBranchById(id: string): Promise<BranchPayload | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branch = await prisma.branch.findUnique({ where: { id } });
  return branch ? serializeBranch(branch) : null;
}

export async function createBranch(
  formData: FormData
): Promise<ActionResult<BranchPayload>> {
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
    return { success: true, data: serializeBranch(branch) };
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
): Promise<ActionResult<BranchPayload>> {
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
    return { success: true, data: serializeBranch(branch) };
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
