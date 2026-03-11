"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { tableSchema, updateTableSchema, updateTableStatusSchema } from "@/lib/validations/table";
import type { ActionResult } from "@/lib/utils";
import type { Table } from "@prisma/client";

export async function getTables(branchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetBranchId = branchId || session.user.branchId;
  if (!targetBranchId) return [];

  return prisma.table.findMany({
    where: { branchId: targetBranchId, isActive: true },
    include: {
      orders: {
        where: { status: "OPEN" },
        include: {
          items: { include: { product: true } },
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { number: "asc" },
  });
}

export async function getTableById(id: string) {
  return prisma.table.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: "OPEN" },
        include: {
          items: {
            include: {
              product: true,
              modifiers: true,
            },
          },
          payments: true,
        },
      },
    },
  });
}

export async function createTable(
  formData: FormData
): Promise<ActionResult<Table>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = tableSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const table = await prisma.table.create({
      data: {
        ...validated.data,
        qrCode: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/order/${validated.data.branchId}/${validated.data.number}`,
      },
    });
    return { success: true, data: table };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat meja.",
    };
  }
}

export async function updateTable(
  id: string,
  formData: FormData
): Promise<ActionResult<Table>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateTableSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: validated.data,
    });
    return { success: true, data: table };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update meja.",
    };
  }
}

export async function updateTableStatus(
  id: string,
  formData: FormData
): Promise<ActionResult<Table>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateTableStatusSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: { status: validated.data.status },
    });
    return { success: true, data: table };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update status meja.",
    };
  }
}

export async function deleteTable(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus meja.",
    };
  }
}
