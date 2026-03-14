"use server";

import QRCode from "qrcode";
import { z } from "zod/v4";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import type { ActionResult } from "@/lib/utils";
import { formatReceiptText, getPaymentMethodLabel } from "@/lib/whatsapp";
import {
  getWhatsAppSessionStatus,
  sendWhatsAppTextMessage,
  startWhatsAppSession,
  stopWhatsAppSession,
  type WhatsAppConnectionStatus,
} from "@/lib/whatsapp-service";

const branchInputSchema = z.object({
  branchId: z.string().min(1, "Branch wajib dipilih"),
});

const sendOrderReceiptSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib"),
  phone: z.string().optional(),
});

type WhatsAppStatusPayload = {
  branchId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber: string | null;
  jid: string | null;
  qrCodeDataUrl: string | null;
  lastError: string | null;
  updatedAt: string;
};

function canManageWhatsApp(role: Parameters<typeof hasPermission>[0]) {
  return hasPermission(role, "branch:manage") || hasPermission(role, "settings:manage");
}

function canSendReceipt(role: Parameters<typeof hasPermission>[0]) {
  return hasPermission(role, "payment:process") || canManageWhatsApp(role);
}

function ensureBranchAccess({
  role,
  userBranchId,
  targetBranchId,
}: {
  role: Parameters<typeof hasPermission>[0];
  userBranchId: string | null;
  targetBranchId: string;
}) {
  if (canManageWhatsApp(role)) {
    return true;
  }

  if (!userBranchId || userBranchId !== targetBranchId) {
    return false;
  }

  return true;
}

async function buildStatusPayload(branchId: string): Promise<WhatsAppStatusPayload> {
  const status = await getWhatsAppSessionStatus(branchId);
  return {
    branchId,
    status: status.status,
    phoneNumber: status.phoneNumber,
    jid: status.jid,
    qrCodeDataUrl: status.qr
      ? await QRCode.toDataURL(status.qr, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
        })
      : null,
    lastError: status.lastError,
    updatedAt: status.updatedAt,
  };
}

export async function getWhatsAppServiceStatus(input: {
  branchId: string;
}): Promise<ActionResult<WhatsAppStatusPayload>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login." };
  }

  const validated = branchInputSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const targetBranchId = validated.data.branchId;
  if (
    !ensureBranchAccess({
      role: session.user.role,
      userBranchId: session.user.branchId,
      targetBranchId,
    })
  ) {
    return { success: false, error: "Anda tidak memiliki akses branch ini." };
  }

  return { success: true, data: await buildStatusPayload(targetBranchId) };
}

export async function startWhatsAppService(input: {
  branchId: string;
}): Promise<ActionResult<WhatsAppStatusPayload>> {
  const session = await auth();
  if (!session?.user || !canManageWhatsApp(session.user.role)) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = branchInputSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const targetBranchId = validated.data.branchId;
  await startWhatsAppSession(targetBranchId, { forceNewLogin: true });

  return { success: true, data: await buildStatusPayload(targetBranchId) };
}

export async function stopWhatsAppService(input: {
  branchId: string;
}): Promise<ActionResult<WhatsAppStatusPayload>> {
  const session = await auth();
  if (!session?.user || !canManageWhatsApp(session.user.role)) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = branchInputSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const targetBranchId = validated.data.branchId;
  await stopWhatsAppSession(targetBranchId);

  return { success: true, data: await buildStatusPayload(targetBranchId) };
}

export async function sendOrderReceiptViaWhatsAppService(input: {
  orderId: string;
  phone?: string;
}): Promise<ActionResult<{ jid: string }>> {
  const session = await auth();
  if (!session?.user || !canSendReceipt(session.user.role)) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = sendOrderReceiptSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const order = await prisma.order.findUnique({
    where: { id: validated.data.orderId },
    include: {
      branch: true,
      table: true,
      items: {
        include: {
          product: true,
          variant: true,
          modifiers: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  if (
    !ensureBranchAccess({
      role: session.user.role,
      userBranchId: session.user.branchId,
      targetBranchId: order.branchId,
    })
  ) {
    return { success: false, error: "Anda tidak memiliki akses branch pesanan ini." };
  }

  const inputPhone = validated.data.phone?.trim();
  const targetPhone = inputPhone || order.customerPhone || "";

  if (!targetPhone) {
    return { success: false, error: "Pesanan ini tidak memiliki nomor WhatsApp pelanggan." };
  }

  if (inputPhone && inputPhone !== (order.customerPhone?.trim() || "")) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        customerPhone: inputPhone,
      },
    });
    order.customerPhone = inputPhone;
  }

  const receiptText = formatReceiptText({
    orderNumber: order.orderNumber,
    branchName: order.branch.name,
    tableName: order.table
      ? `#${order.table.number}${order.table.name ? ` - ${order.table.name}` : ""}`
      : "Takeaway",
    customerName: order.customerName || "Pelanggan",
    items: order.items
      .filter((item) => item.status !== "CANCELLED")
      .map((item) => ({
        name: item.product.name,
        variantName: item.variant?.name,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        modifiers: item.modifiers.map((modifier) => ({
          name: modifier.name,
          price: Number(modifier.price),
        })),
      })),
    subtotal: Number(order.subtotal),
    taxRate: Number(order.taxRate),
    taxAmount: Number(order.taxAmount),
    serviceRate: Number(order.serviceRate),
    serviceAmount: Number(order.serviceAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.payments[0]
      ? getPaymentMethodLabel(order.payments[0].method)
      : undefined,
    paidAmount: order.payments[0] ? Number(order.payments[0].receivedAmount) : undefined,
    changeAmount: order.payments[0] ? Number(order.payments[0].changeAmount) : undefined,
    createdAt: order.createdAt,
  });

  try {
    const result = await sendWhatsAppTextMessage({
      branchId: order.branchId,
      phone: targetPhone,
      text: receiptText,
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengirim struk WhatsApp.",
    };
  }
}
