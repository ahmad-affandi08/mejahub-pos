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

const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, "ID pembayaran wajib"),
  reason: z.string().trim().min(3, "Alasan refund minimal 3 karakter").max(300),
});

type PaymentCompletionContext = {
  orderId: string;
  orderNumber: string;
  branchId: string;
  tableId: string | null;
  tableStatusAfterPayment: "AVAILABLE" | "OCCUPIED";
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

function ensureBranchAccess(
  userBranchId: string | null | undefined,
  targetBranchId: string
) {
  if (userBranchId && userBranchId !== targetBranchId) {
    throw new Error("Akses branch tidak valid.");
  }
}

function resolveOptionalCustomerInfo(input: {
  customerName?: string;
  customerPhone?: string;
}) {
  const customerName = input.customerName?.trim();
  const customerPhoneRaw = input.customerPhone?.trim();

  if ((customerName && !customerPhoneRaw) || (!customerName && customerPhoneRaw)) {
    throw new Error("Nama dan nomor pelanggan harus diisi lengkap.");
  }

  if (!customerName || !customerPhoneRaw) {
    return { customerName: undefined, customerPhone: undefined };
  }

  if (customerName.length < 2) {
    throw new Error("Nama pelanggan minimal 2 karakter.");
  }

  const normalizedPhone = customerPhoneRaw.replace(/\D/g, "");
  if (normalizedPhone.length < 9) {
    throw new Error("Nomor WhatsApp tidak valid.");
  }

  return {
    customerName,
    customerPhone: normalizedPhone,
  };
}

async function handlePaymentCompletionSideEffects(params: {
  context: PaymentCompletionContext;
  userId: string;
  auditEntityId: string;
  auditData: Record<string, unknown>;
  notifyMethod: string;
  notifyAmount: number;
}) {
  await logAudit({
    action: "UPDATE",
    entity: "payments",
    entityId: params.auditEntityId,
    newData: {
      orderNumber: params.context.orderNumber,
      ...params.auditData,
    },
    userId: params.userId,
    branchId: params.context.branchId,
  });

  notifyPaymentCompleted(params.context.branchId, {
    orderId: params.context.orderId,
    orderNumber: params.context.orderNumber,
    method: params.notifyMethod,
    amount: params.notifyAmount,
  });

  if (params.context.tableId) {
    notifyTableStatusChange(params.context.branchId, {
      tableId: params.context.tableId,
      status: params.context.tableStatusAfterPayment,
    });
  }
}

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
    const paymentResult = await prisma.$transaction(async (tx) => {
      // 1. Get order
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: {
          payments: {
            where: { status: "COMPLETED" },
            select: { amount: true },
          },
        },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      ensureBranchAccess(session.user.branchId, order.branchId);
      if (order.status !== "OPEN") {
        throw new Error("Pesanan sudah dibayar atau dibatalkan.");
      }

      // 2. Validate payment amount covers total
      const existingPaid = order.payments
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = roundCurrency(Number(order.totalAmount) - existingPaid);

      if (remaining <= 0) {
        throw new Error("Pesanan ini tidak memiliki sisa tagihan.");
      }

      if (data.amount < remaining) {
        throw new Error(
          `Pembayaran kurang. Sisa tagihan: Rp ${remaining.toLocaleString("id-ID")}`
        );
      }

      // 3. Calculate change (cash only)
      const { customerName, customerPhone } = resolveOptionalCustomerInfo(data);

      const receivedAmount =
        data.method === "CASH"
          ? roundCurrency(data.receivedAmount ?? remaining)
          : remaining;

      if (data.method === "CASH" && receivedAmount < remaining) {
        throw new Error(
          `Uang diterima kurang. Minimal Rp ${remaining.toLocaleString("id-ID")}`
        );
      }

      const changeAmount =
        data.method === "CASH"
          ? calculateChange(remaining, receivedAmount)
          : 0;

      // 4. Create payment record
      const newPayment = await tx.payment.create({
        data: {
          method: data.method as Payment["method"],
          status: "COMPLETED",
          amount: remaining, // Actual amount applied
          receivedAmount,
          changeAmount,
          reference: data.reference?.trim() || undefined,
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

      // 6. Update table status based on kitchen progress
      const hasPendingKitchenItems = await tx.orderItem.findFirst({
        where: {
          orderId: order.id,
          status: { notIn: ["SERVED", "CANCELLED"] },
        },
        select: { id: true },
      });

      const tableStatusAfterPayment: "AVAILABLE" | "OCCUPIED" =
        hasPendingKitchenItems ? "OCCUPIED" : "AVAILABLE";

      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: tableStatusAfterPayment },
        });
      }

      // 7. Update shift totals (if shift exists)
      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: {
            totalSales: { increment: remaining },
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

      return {
        payment: newPayment,
        context: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          branchId: order.branchId,
          tableId: order.tableId,
          tableStatusAfterPayment,
        } satisfies PaymentCompletionContext,
      };
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    await handlePaymentCompletionSideEffects({
      context: paymentResult.context,
      userId: session.user.id,
      auditEntityId: paymentResult.payment.id,
      auditData: {
        method: paymentResult.payment.method,
        amount: Number(paymentResult.payment.amount),
        status: paymentResult.payment.status,
      },
      notifyMethod: paymentResult.payment.method,
      notifyAmount: Number(paymentResult.payment.amount),
    });

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
    const splitResult = await prisma.$transaction(async (tx) => {
      // 1. Get order
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: {
          payments: {
            where: { status: "COMPLETED" },
            select: { amount: true },
          },
        },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      ensureBranchAccess(session.user.branchId, order.branchId);
      if (order.status !== "OPEN") {
        throw new Error("Pesanan sudah dibayar atau dibatalkan.");
      }

      const existingPaid = order.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const remaining = roundCurrency(Number(order.totalAmount) - existingPaid);

      if (remaining <= 0) {
        throw new Error("Pesanan ini tidak memiliki sisa tagihan.");
      }

      // 2. Validate total covers remaining bill (must be exact)
      const totalPayment = roundCurrency(
        data.payments.reduce((sum, payment) => sum + payment.amount, 0)
      );

      if (totalPayment < remaining) {
        throw new Error(
          `Total pembayaran (Rp ${totalPayment.toLocaleString("id-ID")}) kurang dari sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`
        );
      }

      if (totalPayment > remaining) {
        throw new Error(
          `Total pembayaran (Rp ${totalPayment.toLocaleString("id-ID")}) melebihi sisa tagihan (Rp ${remaining.toLocaleString("id-ID")})`
        );
      }

      // 3. Create payment records
      let totalCashIn = 0;
      for (const payment of data.payments) {
        const paymentAmount = roundCurrency(payment.amount);
        const receivedAmount =
          payment.method === "CASH"
            ? roundCurrency(payment.receivedAmount ?? paymentAmount)
            : paymentAmount;

        if (payment.method === "CASH" && receivedAmount < paymentAmount) {
          throw new Error(
            `Uang diterima untuk pembayaran tunai harus minimal Rp ${paymentAmount.toLocaleString("id-ID")}`
          );
        }

        const changeAmount =
          payment.method === "CASH"
            ? calculateChange(paymentAmount, receivedAmount)
            : 0;

        await tx.payment.create({
          data: {
            method: payment.method as Payment["method"],
            status: "COMPLETED",
            amount: paymentAmount,
            receivedAmount,
            changeAmount,
            reference: payment.reference?.trim() || undefined,
            orderId: data.orderId,
          },
        });

        if (payment.method === "CASH") {
          totalCashIn += paymentAmount;
        }
      }

      // 4. Mark order as PAID
      await tx.order.update({
        where: { id: data.orderId },
        data: { status: "PAID" },
      });

      // 5. Update table status based on kitchen progress
      const hasPendingKitchenItems = await tx.orderItem.findFirst({
        where: {
          orderId: order.id,
          status: { notIn: ["SERVED", "CANCELLED"] },
        },
        select: { id: true },
      });

      const tableStatusAfterPayment: "AVAILABLE" | "OCCUPIED" =
        hasPendingKitchenItems ? "OCCUPIED" : "AVAILABLE";

      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: tableStatusAfterPayment },
        });
      }

      // 6. Update shift
      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: {
            totalSales: { increment: remaining },
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

      return {
        context: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          branchId: order.branchId,
          tableId: order.tableId,
          tableStatusAfterPayment,
        } satisfies PaymentCompletionContext,
        totalPayment,
      };
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    await handlePaymentCompletionSideEffects({
      context: splitResult.context,
      userId: session.user.id,
      auditEntityId: data.orderId,
      auditData: {
        splitBill: true,
        totalMethods: data.payments.length,
        totalAmount: splitResult.totalPayment,
      },
      notifyMethod: "SPLIT",
      notifyAmount: splitResult.totalPayment,
    });

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

  const validated = refundPaymentSchema.safeParse({
    paymentId,
    reason,
  });

  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const refundResult = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: validated.data.paymentId },
        include: { order: true },
      });
      if (!payment) throw new Error("Pembayaran tidak ditemukan.");
      ensureBranchAccess(session.user.branchId, payment.order.branchId);
      if (payment.status !== "COMPLETED") {
        throw new Error("Hanya pembayaran COMPLETED yang bisa di-refund.");
      }

      const orderWasPaid = payment.order.status === "PAID";

      // Refund payment
      await tx.payment.update({
        where: { id: validated.data.paymentId },
        data: { status: "REFUNDED" },
      });

      const completedAfterRefund = await tx.payment.aggregate({
        where: {
          orderId: payment.orderId,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      });

      const paidAfterRefund = Number(completedAfterRefund._sum.amount ?? 0);
      const totalOrderAmount = Number(payment.order.totalAmount);
      const nextOrderStatus = paidAfterRefund >= totalOrderAmount ? "PAID" : "OPEN";
      const transitionedToOpen = orderWasPaid && nextOrderStatus === "OPEN";

      // Recalculate order status after refund
      const nextOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: nextOrderStatus,
        },
        select: {
          id: true,
          orderNumber: true,
          branchId: true,
          tableId: true,
          shiftId: true,
        },
      });

      const nextTableStatus = nextOrderStatus === "OPEN" ? "OCCUPIED" : "AVAILABLE";

      const updatedOrder = {
        branchId: nextOrder.branchId,
        tableId: nextOrder.tableId,
        tableStatus: nextTableStatus,
      };

      if (nextOrder.tableId) {
        await tx.table.update({
          where: { id: nextOrder.tableId },
          data: { status: nextTableStatus },
        });
      }

      // Reverse shift totals
      if (nextOrder.shiftId) {
        await tx.shift.update({
          where: { id: nextOrder.shiftId },
          data: {
            totalSales: { decrement: Number(payment.amount) },
            ...(transitionedToOpen ? { totalOrders: { decrement: 1 } } : {}),
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
          entityId: validated.data.paymentId,
          oldData: { status: "COMPLETED" },
          newData: {
            status: "REFUNDED",
            reason: validated.data.reason,
            orderId: payment.orderId,
            amount: Number(payment.amount),
          },
          userId: session.user!.id,
          branchId: payment.order.branchId,
        },
      });

      return updatedOrder;
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/shifts");

    if (refundResult.tableId) {
      notifyTableStatusChange(refundResult.branchId, {
        tableId: refundResult.tableId,
        status: refundResult.tableStatus,
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
        customerName: data.customerName.trim(),
        customerPhone: normalizedPhone,
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
