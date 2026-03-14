"use server";

import { logAudit } from "@/lib/audit";
import { notifyPaymentCompleted, notifyTableStatusChange } from "@/lib/socket-events";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import { calculateChange } from "@/lib/calculations";
import { z } from "zod/v4";
import {
  processPaymentSchema,
  splitBillPaymentSchema,
} from "@/lib/validations/order";
import type { Payment } from "@prisma/client";

const saveOrderCustomerSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
  customerName: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter"),
  customerPhone: z.string().trim().min(9, "Nomor WhatsApp tidak valid"),
});

// ============================================================
// PROCESS SINGLE PAYMENT
// ============================================================

export async function processPayment(input: {
  orderId: string;
  method: string;
  amount: number;
  receivedAmount?: number;
  reference?: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payment:process")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = processPaymentSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Get order
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { payments: true, shift: true },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "OPEN") {
        throw new Error("Pesanan sudah dibayar atau dibatalkan.");
      }

      // 2. Validate payment amount covers total
      const existingPaid = order.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(order.totalAmount) - existingPaid;

      if (data.amount < remaining) {
        throw new Error(
          `Pembayaran kurang. Sisa tagihan: Rp ${remaining.toLocaleString("id-ID")}`
        );
      }

      // 3. Calculate change (cash only)
      const receivedAmount =
        data.method === "CASH"
          ? data.receivedAmount || data.amount
          : data.amount;
      const changeAmount =
        data.method === "CASH"
          ? calculateChange(remaining, receivedAmount)
          : 0;

      const customerName = data.customerName?.trim();
      const customerPhone = data.customerPhone?.trim();
      if ((customerName && !customerPhone) || (!customerName && customerPhone)) {
        throw new Error("Nama dan nomor pelanggan harus diisi lengkap.");
      }

      // 4. Create payment record
      const newPayment = await tx.payment.create({
        data: {
          method: data.method as Payment["method"],
          status: "COMPLETED",
          amount: remaining, // Actual amount applied
          receivedAmount,
          changeAmount,
          reference: data.reference,
          orderId: data.orderId,
        },
      });

      // 5. Mark order as PAID
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          status: "PAID",
          ...(customerName ? { customerName } : {}),
          ...(customerPhone ? { customerPhone } : {}),
        },
      });

      // 6. Release table
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      // 7. Update shift totals (if shift exists)
      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: {
            totalSales: { increment: Number(order.totalAmount) },
            totalOrders: { increment: 1 },
          },
        });

        // Record cash drawer transaction (for CASH payments)
        if (data.method === "CASH") {
          await tx.cashDrawerTransaction.create({
            data: {
              type: "CASH_IN",
              amount: remaining,
              reason: `Pembayaran order ${order.orderNumber}`,
              shiftId: order.shiftId,
              userId: session.user!.id,
            },
          });
        }
      }

      return newPayment;
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { orderNumber: true, branchId: true },
    });

    if (order) {
      await logAudit({
        action: "UPDATE",
        entity: "payments",
        entityId: payment.id,
        newData: {
          orderNumber: order.orderNumber,
          method: payment.method,
          amount: Number(payment.amount),
          status: payment.status,
        },
        userId: session.user.id,
        branchId: order.branchId,
      });

      notifyPaymentCompleted(order.branchId, {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
        method: payment.method,
        amount: Number(payment.amount),
      });

      const paidOrder = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { tableId: true },
      });

      if (paidOrder?.tableId) {
        notifyTableStatusChange(order.branchId, {
          tableId: paidOrder.tableId,
          status: "AVAILABLE",
        });
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memproses pembayaran.",
    };
  }
}

// ============================================================
// SPLIT BILL PAYMENT
// ============================================================

export async function processSplitBill(input: {
  orderId: string;
  payments: Array<{
    method: string;
    amount: number;
    receivedAmount?: number;
    reference?: string;
  }>;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payment:process")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = splitBillPaymentSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get order
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { payments: true },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "OPEN") {
        throw new Error("Pesanan sudah dibayar atau dibatalkan.");
      }

      // 2. Validate total covers order
      const totalPayment = data.payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPayment < Number(order.totalAmount)) {
        throw new Error(
          `Total pembayaran (Rp ${totalPayment.toLocaleString("id-ID")}) kurang dari tagihan (Rp ${Number(order.totalAmount).toLocaleString("id-ID")})`
        );
      }

      // 3. Create payment records
      let totalCashIn = 0;
      for (const payment of data.payments) {
        const receivedAmount =
          payment.method === "CASH"
            ? payment.receivedAmount || payment.amount
            : payment.amount;
        const changeAmount =
          payment.method === "CASH"
            ? calculateChange(payment.amount, receivedAmount)
            : 0;

        await tx.payment.create({
          data: {
            method: payment.method as Payment["method"],
            status: "COMPLETED",
            amount: payment.amount,
            receivedAmount,
            changeAmount,
            reference: payment.reference,
            orderId: data.orderId,
          },
        });

        if (payment.method === "CASH") {
          totalCashIn += payment.amount;
        }
      }

      // 4. Mark order as PAID
      await tx.order.update({
        where: { id: data.orderId },
        data: { status: "PAID" },
      });

      // 5. Release table
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      // 6. Update shift
      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: {
            totalSales: { increment: Number(order.totalAmount) },
            totalOrders: { increment: 1 },
          },
        });

        if (totalCashIn > 0) {
          await tx.cashDrawerTransaction.create({
            data: {
              type: "CASH_IN",
              amount: totalCashIn,
              reason: `Split bill - order ${order.orderNumber}`,
              shiftId: order.shiftId,
              userId: session.user!.id,
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { orderNumber: true, branchId: true },
    });

    if (order) {
      await logAudit({
        action: "UPDATE",
        entity: "payments",
        entityId: data.orderId,
        newData: {
          orderNumber: order.orderNumber,
          splitBill: true,
          totalMethods: data.payments.length,
          totalAmount: data.payments.reduce((sum, payment) => sum + payment.amount, 0),
        },
        userId: session.user.id,
        branchId: order.branchId,
      });

      notifyPaymentCompleted(order.branchId, {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
        method: "SPLIT",
        amount: data.payments.reduce((sum, payment) => sum + payment.amount, 0),
      });

      const paidOrder = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { tableId: true },
      });

      if (paidOrder?.tableId) {
        notifyTableStatusChange(order.branchId, {
          tableId: paidOrder.tableId,
          status: "AVAILABLE",
        });
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memproses split bill.",
    };
  }
}

// ============================================================
// REFUND PAYMENT
// ============================================================

export async function refundPayment(
  paymentId: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payment:refund")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    let updatedOrder: { branchId: string; tableId: string | null } | null = null;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment) throw new Error("Pembayaran tidak ditemukan.");
      if (payment.status !== "COMPLETED") {
        throw new Error("Hanya pembayaran COMPLETED yang bisa di-refund.");
      }

      const orderWasPaid = payment.order.status === "PAID";

      // Refund payment
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "REFUNDED" },
      });

      // Re-open order if needed
      const nextOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderWasPaid ? "OPEN" : payment.order.status,
        },
        select: {
          id: true,
          orderNumber: true,
          branchId: true,
          tableId: true,
          shiftId: true,
        },
      });

      updatedOrder = {
        branchId: nextOrder.branchId,
        tableId: nextOrder.tableId,
      };

      if (nextOrder.tableId) {
        await tx.table.update({
          where: { id: nextOrder.tableId },
          data: { status: "OCCUPIED" },
        });
      }

      // Reverse shift totals
      if (nextOrder.shiftId) {
        await tx.shift.update({
          where: { id: nextOrder.shiftId },
          data: {
            totalSales: { decrement: Number(payment.amount) },
            ...(orderWasPaid ? { totalOrders: { decrement: 1 } } : {}),
          },
        });

        if (payment.method === "CASH") {
          await tx.cashDrawerTransaction.create({
            data: {
              type: "CASH_OUT",
              amount: Number(payment.amount),
              reason: `Refund order ${nextOrder.orderNumber}`,
              shiftId: nextOrder.shiftId,
              userId: session.user!.id,
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "REFUND",
          entity: "payments",
          entityId: paymentId,
          oldData: { status: "COMPLETED" },
          newData: {
            status: "REFUNDED",
            reason,
            orderId: payment.orderId,
            amount: Number(payment.amount),
          },
          userId: session.user!.id,
          branchId: payment.order.branchId,
        },
      });
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/shifts");

    if (updatedOrder?.tableId) {
      notifyTableStatusChange(updatedOrder.branchId, {
        tableId: updatedOrder.tableId,
        status: "OCCUPIED",
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal refund.",
    };
  }
}

// ============================================================
// SAVE ORDER CUSTOMER (UNPAID)
// ============================================================

export async function saveOrderCustomerInfo(input: {
  orderId: string;
  customerName: string;
  customerPhone: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "payment:process")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = saveOrderCustomerSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;
  const normalizedPhone = data.customerPhone.replace(/\D/g, "");
  if (normalizedPhone.length < 9) {
    return { success: false, error: "Nomor WhatsApp tidak valid." };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, branchId: true, status: true },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    if (session.user.branchId && order.branchId !== session.user.branchId) {
      return { success: false, error: "Akses branch tidak valid." };
    }

    if (order.status !== "OPEN") {
      return {
        success: false,
        error: "Data pelanggan hanya bisa diubah sebelum pesanan dibayar.",
      };
    }

    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${data.orderId}`);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data pelanggan.",
    };
  }
}
