"use server";

import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyNewCustomerOrder, notifyOrderUpdated } from "@/lib/socket-events";
import { getClientFingerprint, sanitizeMultilineText, sanitizeText } from "@/lib/security";
import { generateOrderNumber, type ActionResult } from "@/lib/utils";
import {
  calculateOrderTotal,
  calculateItemSubtotal,
  type OrderLineItem,
} from "@/lib/calculations";
import {
  publicCustomerOrderSchema,
  type PublicCustomerOrderInput,
} from "@/lib/validations/order";
import { OrderStatus } from "@prisma/client";

const HAS_PENDING_APPROVAL_STATUS = "PENDING_APPROVAL" in OrderStatus;
const PUBLIC_ACTIVE_ORDER_STATUSES: OrderStatus[] = HAS_PENDING_APPROVAL_STATUS
  ? [OrderStatus.PENDING_APPROVAL, OrderStatus.OPEN]
  : [OrderStatus.OPEN];

/**
 * Get branch info and menu for customer QR ordering (public, no auth required)
 */
export async function getPublicMenu(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId, isActive: true },
    select: {
      id: true,
      name: true,
      taxRate: true,
      serviceRate: true,
    },
  });

  if (!branch) return null;

  const categories = await prisma.category.findMany({
    where: { branchId, isActive: true },
    select: {
      id: true,
      name: true,
      products: {
        where: { isActive: true, isAvailable: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          station: true,
          isAvailable: true,
          variants: {
            where: { isActive: true },
            orderBy: { price: "asc" },
            select: {
              id: true,
              name: true,
              price: true,
              isActive: true,
            },
          },
          modifierGroups: {
            select: {
              modifierGroup: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  isRequired: true,
                  minSelect: true,
                  maxSelect: true,
                  modifiers: {
                    where: { isActive: true },
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return {
    branch: {
      id: branch.id,
      name: branch.name,
      taxRate: Number(branch.taxRate),
      serviceRate: Number(branch.serviceRate),
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        image: product.image,
        station: product.station,
        isAvailable: product.isAvailable,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: Number(variant.price),
          isActive: variant.isActive,
        })),
        modifierGroups: product.modifierGroups.map((productGroup) => ({
          modifierGroup: {
            id: productGroup.modifierGroup.id,
            name: productGroup.modifierGroup.name,
            type: productGroup.modifierGroup.type,
            isRequired: productGroup.modifierGroup.isRequired,
            minSelect: productGroup.modifierGroup.minSelect,
            maxSelect: productGroup.modifierGroup.maxSelect,
            modifiers: productGroup.modifierGroup.modifiers.map((modifier) => ({
              id: modifier.id,
              name: modifier.name,
              price: Number(modifier.price),
              isActive: modifier.isActive,
            })),
          },
        })),
      })),
    })),
  };
}

/**
 * Validate table exists for QR ordering
 */
export async function getPublicTable(branchId: string, tableNumber: number) {
  return prisma.table.findFirst({
    where: {
      branchId,
      number: tableNumber,
      isActive: true,
    },
    select: {
      id: true,
      number: true,
      name: true,
      status: true,
    },
  });
}

/**
 * Get latest tracking snapshot for customer QR order.
 * If orderNumber is provided, returns that exact order (even if already PAID/CANCELLED).
 * Otherwise returns latest active order (PENDING_APPROVAL/OPEN) for the table.
 */
export async function getPublicOrderTracking(input: {
  branchId: string;
  tableId: string;
  orderNumber?: string;
}) {
  const branchId = input.branchId?.trim();
  const tableId = input.tableId?.trim();
  const orderNumber = input.orderNumber?.trim();

  if (!branchId || !tableId) return null;

  const order = await prisma.order.findFirst({
    where: {
      branchId,
      tableId,
      ...(orderNumber
        ? { orderNumber }
        : {
            status: { in: PUBLIC_ACTIVE_ORDER_STATUSES },
          }),
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          status: true,
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!order) return null;

  const itemCounts = order.items.reduce(
    (acc, item) => {
      acc.total += item.quantity;
      acc[item.status] += item.quantity;
      return acc;
    },
    {
      PENDING: 0,
      COOKING: 0,
      READY: 0,
      SERVED: 0,
      CANCELLED: 0,
      total: 0,
    }
  );

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    itemCounts,
  };
}

/**
 * Customer self-ordering (no auth, public)
 */
export async function createCustomerOrder(
  input: PublicCustomerOrderInput
): Promise<ActionResult<{ id: string; orderNumber: string; status: string }>> {
  const validated = publicCustomerOrderSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const fingerprint = await getClientFingerprint(
    "qr-order",
    `${validated.data.branchId}:${validated.data.tableId}`
  );
  const rateLimit = checkRateLimit(fingerprint, {
    limit: 6,
    windowMs: 2 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Terlalu banyak pesanan dari perangkat ini. Coba lagi dalam ${rateLimit.retryAfter} detik.`,
    };
  }

  const safeInput = {
    ...validated.data,
    customerName: sanitizeText(validated.data.customerName, 120),
    customerPhone: validated.data.customerPhone
      ? sanitizeText(validated.data.customerPhone, 30)
      : undefined,
    notes: validated.data.notes
      ? sanitizeMultilineText(validated.data.notes, 500)
      : undefined,
    items: validated.data.items.map((item) => ({
      ...item,
      notes: item.notes ? sanitizeMultilineText(item.notes, 200) : undefined,
    })),
  };

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Get branch
      const branch = await tx.branch.findUnique({
        where: { id: input.branchId },
      });
      if (!branch) throw new Error("Cabang tidak ditemukan.");

      // 2. Verify table
      const table = await tx.table.findUnique({
        where: { id: input.tableId },
      });
      if (!table) throw new Error("Meja tidak ditemukan.");

      const existingOpenOrder = await tx.order.findFirst({
        where: { tableId: input.tableId, status: "OPEN" },
      });

      if (existingOpenOrder) {
        throw new Error(
          `Meja ini sudah memiliki pesanan aktif (${existingOpenOrder.orderNumber}). Minta staf menambahkan item dari POS.`
        );
      }

      // 3. Check if table already has a pending QR order
      const existingPendingOrder = HAS_PENDING_APPROVAL_STATUS
        ? await tx.order.findFirst({
            where: { tableId: input.tableId, status: OrderStatus.PENDING_APPROVAL },
          })
        : null;

      // 4. Validate products
      const productIds = safeInput.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true, isAvailable: true },
        include: {
          variants: true,
          modifierGroups: {
            include: {
              modifierGroup: { include: { modifiers: true } },
            },
          },
        },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // 5. Build order items
      const orderLineItems: OrderLineItem[] = [];
      const orderItemsData: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        notes?: string;
        station: "KITCHEN" | "BAR";
        modifiers: Array<{ modifierId: string; name: string; price: number }>;
      }> = [];

      for (const item of safeInput.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error("Produk tidak tersedia.");

        let unitPrice = Number(product.price);
        if (item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) throw new Error("Varian tidak ditemukan.");
          unitPrice = Number(variant.price);
        }

        let modifierTotal = 0;
        const modifierData: Array<{ modifierId: string; name: string; price: number }> = [];

        for (const mod of item.modifiers) {
          let foundModifier = null;
          for (const pmg of product.modifierGroups) {
            const m = pmg.modifierGroup.modifiers.find((m) => m.id === mod.modifierId);
            if (m) { foundModifier = m; break; }
          }
          if (!foundModifier) throw new Error("Modifier tidak ditemukan.");
          modifierTotal += Number(foundModifier.price);
          modifierData.push({
            modifierId: foundModifier.id,
            name: foundModifier.name,
            price: Number(foundModifier.price),
          });
        }

        const lineItem: OrderLineItem = { unitPrice, quantity: item.quantity, modifierTotal };
        orderLineItems.push(lineItem);

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          subtotal: calculateItemSubtotal(lineItem),
          notes: item.notes,
          station: product.station,
          modifiers: modifierData,
        });
      }

      // 6. Calculate totals
      const totals = calculateOrderTotal(
        orderLineItems,
        Number(branch.taxRate),
        Number(branch.serviceRate)
      );

      if (existingPendingOrder) {
        // Add items to existing pending approval order
        for (const itemData of orderItemsData) {
          await tx.orderItem.create({
            data: {
              orderId: existingPendingOrder.id,
              productId: itemData.productId,
              variantId: itemData.variantId,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice,
              subtotal: itemData.subtotal,
              notes: itemData.notes,
              status: "PENDING",
              station: itemData.station,
              modifiers: {
                create: itemData.modifiers.map((m) => ({
                  modifierId: m.modifierId,
                  name: m.name,
                  price: m.price,
                })),
              },
            },
          });
        }

        // Recalculate order totals
        const allItems = await tx.orderItem.findMany({
          where: { orderId: existingPendingOrder.id, status: { not: "CANCELLED" } },
          include: { modifiers: true },
        });

        const allLineItems: OrderLineItem[] = allItems.map((item) => ({
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          modifierTotal: item.modifiers.reduce((sum, m) => sum + Number(m.price), 0),
        }));

        const newTotals = calculateOrderTotal(
          allLineItems,
          Number(branch.taxRate),
          Number(branch.serviceRate)
        );

        const updatedOrder = await tx.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            subtotal: newTotals.subtotal,
            taxAmount: newTotals.taxAmount,
            serviceAmount: newTotals.serviceAmount,
            totalAmount: newTotals.totalAmount,
            customerName: safeInput.customerName || existingPendingOrder.customerName,
            customerPhone: safeInput.customerPhone || existingPendingOrder.customerPhone,
          },
        });

        return updatedOrder;
      }

      // 7. Get a staff user for the order (first active user in branch)
      const staffUser = await tx.user.findFirst({
        where: { branchId: input.branchId, isActive: true },
        select: { id: true },
      });
      if (!staffUser) throw new Error("Tidak ada staf tersedia.");

      // 8. Create new order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          type: "DINE_IN",
          status: HAS_PENDING_APPROVAL_STATUS
            ? OrderStatus.PENDING_APPROVAL
            : OrderStatus.OPEN,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          taxRate: Number(branch.taxRate),
          serviceAmount: totals.serviceAmount,
          serviceRate: Number(branch.serviceRate),
          discountAmount: 0,
          totalAmount: totals.totalAmount,
          notes: safeInput.notes,
          customerName: safeInput.customerName,
          customerPhone: safeInput.customerPhone,
          tableId: input.tableId,
          branchId: input.branchId,
          userId: staffUser.id,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              notes: item.notes,
              status: "PENDING",
              station: item.station,
              modifiers: {
                create: item.modifiers.map((m) => ({
                  modifierId: m.modifierId,
                  name: m.name,
                  price: m.price,
                })),
              },
            })),
          },
        },
      });

      // 9. Update table status
      await tx.table.update({
        where: { id: input.tableId },
        data: { status: "OCCUPIED" },
      });

      return newOrder;
    });

    await logAudit({
      action: "CREATE",
      entity: "orders",
      entityId: order.id,
      newData: {
        source: "qr-self-order",
        approvalStatus: HAS_PENDING_APPROVAL_STATUS ? OrderStatus.PENDING_APPROVAL : OrderStatus.OPEN,
        orderNumber: order.orderNumber,
        customerName: safeInput.customerName,
        itemCount: safeInput.items.length,
      },
      userId: order.userId,
      branchId: order.branchId,
    });

    const table = await prisma.table.findUnique({
      where: { id: order.tableId ?? "" },
      select: { number: true, name: true },
    });

    notifyNewCustomerOrder(order.branchId, {
      orderNumber: order.orderNumber,
      tableName: table
        ? `${table.number}${table.name ? ` - ${table.name}` : ""}`
        : "Unknown",
      customerName: safeInput.customerName,
    });

    notifyOrderUpdated(order.branchId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      source: "qr-self-order",
    });

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat pesanan.",
    };
  }
}
