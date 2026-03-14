"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import {
  openShiftSchema,
  closeShiftSchema,
  cashDrawerTransactionSchema,
} from "@/lib/validations/shift";

// ============================================================
// GET ACTIVE SHIFT
// ============================================================

export async function getActiveShift() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return null;

  return prisma.shift.findFirst({
    where: {
      userId: session.user.id,
      branchId,
      closedAt: null,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      orders: {
        select: { id: true, orderNumber: true, totalAmount: true, status: true },
      },
      cashTransactions: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { openedAt: "desc" },
  });
}

/**
 * Get any active shift for the branch (for shift guard)
 */
export async function getBranchActiveShift() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return null;

  return prisma.shift.findFirst({
    where: {
      userId: session.user.id,
      branchId,
      closedAt: null,
    },
    select: { id: true },
  });
}

// ============================================================
// GET SHIFT HISTORY
// ============================================================

export async function getShiftHistory(filters?: { date?: string }) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "shift:view")) {
    throw new Error("Unauthorized");
  }

  const branchId = session.user.branchId;
  if (!branchId) return [];

  const where: Record<string, unknown> = { branchId };

  // Filter by user if not manager/admin
  if (!hasPermission(session.user.role, "shift:manage")) {
    where.userId = session.user.id;
  }

  if (filters?.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    where.openedAt = { gte: start, lt: end };
  }

  return prisma.shift.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      _count: { select: { orders: true, cashTransactions: true } },
    },
    orderBy: { openedAt: "desc" },
    take: 50,
  });
}

// ============================================================
// OPEN SHIFT
// ============================================================

export async function openShift(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "shift:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const branchId = session.user.branchId;
  if (!branchId) {
    return { success: false, error: "Branch tidak ditemukan." };
  }

  const raw = Object.fromEntries(formData);
  const validated = openShiftSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // Check if user already has an active shift
  const existing = await prisma.shift.findFirst({
    where: { userId: session.user.id, branchId, closedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "Anda sudah memiliki shift aktif. Tutup shift terlebih dahulu.",
    };
  }

  try {
    const shift = await prisma.shift.create({
      data: {
        openingCash: validated.data.openingCash,
        notes: validated.data.notes,
        userId: session.user.id,
        branchId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SHIFT_OPEN",
        entity: "shifts",
        entityId: shift.id,
        newData: {
          openingCash: validated.data.openingCash,
        },
        userId: session.user.id,
        branchId,
      },
    });

    revalidatePath("/dashboard/shifts");
    revalidatePath("/dashboard/orders");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuka shift.",
    };
  }
}

// ============================================================
// CLOSE SHIFT (Blind Close)
// ============================================================

export async function closeShift(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "shift:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = closeShiftSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.shift.findUnique({
        where: { id: validated.data.shiftId },
        include: {
          orders: {
            where: { status: "PAID" },
            include: {
              payments: { where: { status: "COMPLETED", method: "CASH" } },
            },
          },
          cashTransactions: true,
        },
      });

      if (!existing) throw new Error("Shift tidak ditemukan.");
      if (existing.closedAt) throw new Error("Shift sudah ditutup.");
      if (existing.userId !== session.user!.id) {
        throw new Error("Anda hanya bisa menutup shift Anda sendiri.");
      }

      // Calculate expected cash
      // expectedCash = openingCash + totalCashPayments + cashIn - cashOut
      const totalCashPayments = existing.orders.reduce((sum, order) => {
        const cashPayments = order.payments.reduce(
          (s, p) => s + Number(p.amount),
          0
        );
        return sum + cashPayments;
      }, 0);

      const cashIn = existing.cashTransactions
        .filter((t) => t.type === "CASH_IN")
        .reduce((s, t) => s + Number(t.amount), 0);

      const cashOut = existing.cashTransactions
        .filter((t) => t.type === "CASH_OUT")
        .reduce((s, t) => s + Number(t.amount), 0);

      const expectedCash =
        Number(existing.openingCash) + totalCashPayments + cashIn - cashOut;

      const closingCash = validated.data.closingCash;
      const cashDifference = closingCash - expectedCash;

      // Calculate total sales from all paid orders
      const totalSales = existing.orders.reduce(
        (sum, order) =>
          sum +
          order.payments.reduce((s, p) => s + Number(p.amount), 0),
        0
      );

      const updatedShift = await tx.shift.update({
        where: { id: validated.data.shiftId },
        data: {
          closedAt: new Date(),
          closingCash,
          expectedCash,
          cashDifference,
          totalSales,
          totalOrders: existing.orders.length,
          notes: validated.data.notes || existing.notes,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "SHIFT_CLOSE",
          entity: "shifts",
          entityId: updatedShift.id,
          newData: {
            closingCash,
            expectedCash,
            cashDifference,
            totalSales,
            totalOrders: existing.orders.length,
          },
          userId: session.user!.id,
          branchId: existing.branchId,
        },
      });

      return updatedShift;
    });

    revalidatePath("/dashboard/shifts");
    revalidatePath("/dashboard/orders");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menutup shift.",
    };
  }
}

// ============================================================
// CASH DRAWER TRANSACTION
// ============================================================

export async function addCashDrawerTransaction(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "shift:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = cashDrawerTransactionSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // Verify shift belongs to user and is open
  const shift = await prisma.shift.findUnique({
    where: { id: validated.data.shiftId },
  });
  if (!shift || shift.closedAt) {
    return { success: false, error: "Shift tidak valid atau sudah ditutup." };
  }
  if (shift.userId !== session.user.id) {
    return { success: false, error: "Shift bukan milik Anda." };
  }

  try {
    await prisma.cashDrawerTransaction.create({
      data: {
        type: validated.data.type,
        amount: validated.data.amount,
        reason: validated.data.reason,
        shiftId: validated.data.shiftId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/shifts");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambah transaksi.",
    };
  }
}

// ============================================================
// GET SHIFT BY ID
// ============================================================

export async function getShiftById(id: string) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "shift:view")) {
    throw new Error("Unauthorized");
  }

  return prisma.shift.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      orders: {
        include: {
          payments: true,
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      cashTransactions: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
