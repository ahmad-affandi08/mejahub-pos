"use server";

import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  notifyNewOrder,
  notifyOrderItemStatus,
  notifyOrderUpdated,
  notifyTableStatusChange,
} from "@/lib/socket-events";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { generateOrderNumber, type ActionResult } from "@/lib/utils";
import {
  calculateOrderTotal,
  calculateItemSubtotal,
  type OrderLineItem,
} from "@/lib/calculations";
import {
  createOrderSchema,
  addOrderItemsSchema,
  updateOrderItemStatusSchema,
  cancelOrderSchema,
  approveQrOrderSchema,
  rejectQrOrderSchema,
  transferTableSchema,
  mergeTableSchema,
  type CreateOrderInput,
} from "@/lib/validations/order";
import { OrderStatus, Prisma } from "@prisma/client";

const HAS_PENDING_APPROVAL_STATUS = "PENDING_APPROVAL" in OrderStatus;
const ACTIVE_TABLE_ORDER_STATUSES: OrderStatus[] = HAS_PENDING_APPROVAL_STATUS
  ? [OrderStatus.OPEN, OrderStatus.PENDING_APPROVAL]
  : [OrderStatus.OPEN];

type OrderActionPayload = {
  id: string;
  orderNumber: string;
  totalAmount: number;
};

// ============================================================
// GET ORDERS
// ============================================================

export async function getOrders(filters?: {
  status?: string;
  tableId?: string;
  date?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const branchId = session.user.branchId;
  if (!branchId) return [];

  const where: Record<string, unknown> = {
    branchId,
  };

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.tableId) {
    where.tableId = filters.tableId;
  }
  if (filters?.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  return prisma.order.findMany({
    where,
    include: {
      table: true,
      user: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          product: true,
          variant: true,
          modifiers: true,
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingApprovalOrders() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "qr_order:approve")) {
    throw new Error("Unauthorized");
  }

  const branchId = session.user.branchId;
  if (!branchId) return [];
  if (!HAS_PENDING_APPROVAL_STATUS) return [];

  return prisma.order.findMany({
    where: {
      branchId,
      status: OrderStatus.PENDING_APPROVAL,
    },
    include: {
      table: true,
      user: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          product: true,
          variant: true,
          modifiers: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrderById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      branch: true,
      user: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          product: true,
          variant: true,
          modifiers: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: true,
    },
  });
}

export async function getOpenOrderByTable(tableId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.order.findFirst({
    where: {
      tableId,
      status: "OPEN",
    },
    include: {
      table: true,
      items: {
        include: {
          product: true,
          variant: true,
          modifiers: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: true,
    },
  });
}

// ============================================================
// CREATE ORDER
// ============================================================

export async function createOrder(
  input: CreateOrderInput
): Promise<ActionResult<OrderActionPayload>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "order:create")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = createOrderSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;
  const branchId = session.user.branchId;
  if (!branchId) {
    return { success: false, error: "Branch tidak ditemukan." };
  }

  try {
    // Use interactive transaction for atomicity
    const order = await prisma.$transaction(async (tx) => {
      // 1. Get branch for tax/service rates
      const branch = await tx.branch.findUnique({
        where: { id: branchId },
      });
      if (!branch) throw new Error("Branch tidak ditemukan.");

      // 2. Verify table is available (for dine-in)
      if (data.type === "DINE_IN" && data.tableId) {
        const table = await tx.table.findUnique({
          where: { id: data.tableId },
        });
        if (!table) throw new Error("Meja tidak ditemukan.");

        // Check if table already has an open order
        const existingOrder = await tx.order.findFirst({
          where: { tableId: data.tableId, status: { in: ACTIVE_TABLE_ORDER_STATUSES } },
        });
        if (existingOrder) {
          throw new Error(
            HAS_PENDING_APPROVAL_STATUS && existingOrder.status === OrderStatus.PENDING_APPROVAL
              ? `Meja ${table.number} memiliki pesanan QR menunggu approval (${existingOrder.orderNumber}). Approve/tolak dulu di POS.`
              : `Meja ${table.number} sudah memiliki pesanan aktif (${existingOrder.orderNumber}). Tambahkan item ke pesanan tersebut.`
          );
        }
      }

      // 3. Validate products exist and get prices
      const productIds = data.items.map((item) => item.productId);
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

      // 4. Build order items with verified prices
      const orderLineItems: OrderLineItem[] = [];
      const orderItemsData: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        notes?: string;
        station: "KITCHEN" | "BAR";
        modifiers: Array<{
          modifierId: string;
          name: string;
          price: number;
        }>;
      }> = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Produk tidak ditemukan atau tidak tersedia.`);
        }

        // Use variant price if specified, else product price
        let unitPrice = Number(product.price);
        if (item.variantId) {
          const variant = product.variants.find(
            (v) => v.id === item.variantId
          );
          if (!variant) throw new Error(`Varian tidak ditemukan.`);
          unitPrice = Number(variant.price);
        }

        // Validate modifiers and get prices
        let modifierTotal = 0;
        const modifierData: Array<{
          modifierId: string;
          name: string;
          price: number;
        }> = [];

        for (const mod of item.modifiers) {
          // Verify modifier exists
          let foundModifier = null;
          for (const pmg of product.modifierGroups) {
            const m = pmg.modifierGroup.modifiers.find(
              (m) => m.id === mod.modifierId
            );
            if (m) {
              foundModifier = m;
              break;
            }
          }
          if (!foundModifier) {
            throw new Error(`Modifier tidak ditemukan untuk produk ini.`);
          }
          modifierTotal += Number(foundModifier.price);
          modifierData.push({
            modifierId: foundModifier.id,
            name: foundModifier.name,
            price: Number(foundModifier.price),
          });
        }

        const lineItem: OrderLineItem = {
          unitPrice,
          quantity: item.quantity,
          modifierTotal,
        };
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

      // 5. Calculate totals
      const discount =
        data.discountType && data.discountValue
          ? { type: data.discountType, value: data.discountValue }
          : undefined;

      const totals = calculateOrderTotal(
        orderLineItems,
        Number(branch.taxRate),
        Number(branch.serviceRate),
        discount
      );

      // 6. Get active shift
      const activeShift = await tx.shift.findFirst({
        where: {
          userId: session.user!.id,
          branchId,
          closedAt: null,
        },
        orderBy: { openedAt: "desc" },
      });

      if (!activeShift) {
        throw new Error("Buka shift terlebih dahulu sebelum membuat pesanan.");
      }

      // 7. Create order with nested items
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          type: data.type,
          status: "OPEN",
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          taxRate: Number(branch.taxRate),
          serviceAmount: totals.serviceAmount,
          serviceRate: Number(branch.serviceRate),
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          notes: data.notes,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          tableId: data.tableId,
          branchId,
          userId: session.user!.id,
          shiftId: activeShift?.id,
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
        include: {
          items: { include: { modifiers: true, product: true } },
          table: true,
        },
      });

      // 8. Update table status to OCCUPIED (dine-in)
      if (data.type === "DINE_IN" && data.tableId) {
        await tx.table.update({
          where: { id: data.tableId },
          data: { status: "OCCUPIED" },
        });
      }

      // 9. Auto-deduct stock for each item based on BoM
      await deductStockForItems(tx, orderItemsData, branchId);

      return newOrder;
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/inventory");

    await logAudit({
      action: "CREATE",
      entity: "orders",
      entityId: order.id,
      newData: {
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        tableId: order.tableId,
        source: "pos",
      },
      userId: session.user.id,
      branchId,
    });

    notifyNewOrder(branchId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      source: "pos",
    });

    if (order.tableId) {
      notifyTableStatusChange(branchId, {
        tableId: order.tableId,
        status: "OCCUPIED",
      });
    }

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat pesanan.",
    };
  }
}

// ============================================================
// ADD ITEMS TO EXISTING ORDER
// ============================================================

export async function addOrderItems(
  input: { orderId: string; items: CreateOrderInput["items"] }
): Promise<ActionResult<OrderActionPayload>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "order:create")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = addOrderItemsSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const data = validated.data;
  const branchId = session.user.branchId;
  if (!branchId) return { success: false, error: "Branch tidak ditemukan." };

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Get existing order
      const existingOrder = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { branch: true, items: true },
      });
      if (!existingOrder) throw new Error("Pesanan tidak ditemukan.");
      if (existingOrder.status !== "OPEN") {
        throw new Error("Pesanan sudah ditutup, tidak bisa menambah item.");
      }

      // 2. Validate & build new items (same as createOrder)
      const productIds = data.items.map((item) => item.productId);
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

      const newOrderLineItems: OrderLineItem[] = [];
      const newItemsData: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        notes?: string;
        station: "KITCHEN" | "BAR";
        modifiers: Array<{
          modifierId: string;
          name: string;
          price: number;
        }>;
      }> = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error("Produk tidak tersedia.");

        let unitPrice = Number(product.price);
        if (item.variantId) {
          const variant = product.variants.find(
            (v) => v.id === item.variantId
          );
          if (!variant) throw new Error("Varian tidak ditemukan.");
          unitPrice = Number(variant.price);
        }

        let modifierTotal = 0;
        const modifierData: Array<{
          modifierId: string;
          name: string;
          price: number;
        }> = [];

        for (const mod of item.modifiers) {
          let foundModifier = null;
          for (const pmg of product.modifierGroups) {
            const m = pmg.modifierGroup.modifiers.find(
              (m) => m.id === mod.modifierId
            );
            if (m) {
              foundModifier = m;
              break;
            }
          }
          if (!foundModifier) throw new Error("Modifier tidak ditemukan.");
          modifierTotal += Number(foundModifier.price);
          modifierData.push({
            modifierId: foundModifier.id,
            name: foundModifier.name,
            price: Number(foundModifier.price),
          });
        }

        const lineItem: OrderLineItem = {
          unitPrice,
          quantity: item.quantity,
          modifierTotal,
        };
        newOrderLineItems.push(lineItem);

        newItemsData.push({
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

      // 3. Create new order items
      for (const itemData of newItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: data.orderId,
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

      // 4. Recalculate order totals
      const allItems = await tx.orderItem.findMany({
        where: { orderId: data.orderId, status: { not: "CANCELLED" } },
        include: { modifiers: true },
      });

      const allLineItems: OrderLineItem[] = allItems.map((item) => ({
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        modifierTotal: item.modifiers.reduce(
          (sum, m) => sum + Number(m.price),
          0
        ),
      }));

      const totals = calculateOrderTotal(
        allLineItems,
        Number(existingOrder.taxRate),
        Number(existingOrder.serviceRate)
      );

      // 5. Update order totals
      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          serviceAmount: totals.serviceAmount,
          totalAmount: totals.totalAmount,
        },
        include: {
          items: { include: { modifiers: true, product: true } },
          table: true,
        },
      });

      // 6. Update table status
      if (existingOrder.tableId) {
        await tx.table.update({
          where: { id: existingOrder.tableId },
          data: { status: "WAITING_FOOD" },
        });
      }

      // 7. Auto-deduct stock
      await deductStockForItems(tx, newItemsData, branchId);

      return updatedOrder;
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/kitchen");

    notifyOrderUpdated(branchId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      updated: "items-added",
    });

    if (order.tableId) {
      notifyTableStatusChange(branchId, {
        tableId: order.tableId,
        status: "WAITING_FOOD",
      });
    }

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambah item.",
    };
  }
}

// ============================================================
// UPDATE ORDER ITEM STATUS (KDS)
// ============================================================

export async function updateOrderItemStatus(
  input: { orderItemId: string; status: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "kds:update")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = updateOrderItemStatusSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const { orderItemId, status } = validated.data;

  try {
    const timestampField: Record<string, string> = {
      COOKING: "cookingStartAt",
      READY: "readyAt",
      SERVED: "servedAt",
    };

    const updateData: Record<string, unknown> = { status };
    const field = timestampField[status];
    if (field) {
      updateData[field] = new Date();
    }

    const item = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: updateData,
    });

    const itemOrder = await prisma.order.findFirst({
      where: { items: { some: { id: orderItemId } } },
      select: { id: true, branchId: true, tableId: true },
    });

    // Check if all items are served → update table status
    if (status === "SERVED") {
      const order = await prisma.order.findFirst({
        where: { items: { some: { id: orderItemId } } },
        include: { items: true },
      });

      if (order) {
        const allServed = order.items.every(
          (i) => i.status === "SERVED" || i.status === "CANCELLED"
        );
        if (allServed && order.tableId) {
          await prisma.table.update({
            where: { id: order.tableId },
            data: { status: "REQUESTING_BILL" },
          });

          notifyTableStatusChange(order.branchId, {
            tableId: order.tableId,
            status: "REQUESTING_BILL",
          });
        }
      }
    }

    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    if (itemOrder) {
      notifyOrderItemStatus(itemOrder.branchId, {
        orderId: itemOrder.id,
        itemId: item.id,
        status,
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal update status item.",
    };
  }
}

// ============================================================
// CANCEL ORDER
// ============================================================

export async function cancelOrder(
  input: { orderId: string; reason: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "order:cancel")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = cancelOrderSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: validated.data.orderId },
        include: { items: true },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "OPEN") {
        throw new Error("Hanya pesanan OPEN yang bisa dibatalkan.");
      }

      // Cancel all items
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: "CANCELLED" },
      });

      // Cancel order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          notes: `${order.notes || ""}\n[DIBATALKAN] ${validated.data.reason}`.trim(),
        },
      });

      // Release table
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      // Reverse stock deductions
      await reverseStockForItems(tx, order.items, order.branchId);

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "VOID_ORDER",
          entity: "orders",
          entityId: order.id,
          oldData: { status: order.status },
          newData: { status: "CANCELLED", reason: validated.data.reason },
          userId: session.user!.id,
          branchId: order.branchId,
        },
      });
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/inventory");

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal membatalkan pesanan.",
    };
  }
}

// ============================================================
// VOID SINGLE ORDER ITEM
// ============================================================

export async function voidOrderItem(
  orderItemId: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "order:void")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: { include: { branch: true } } },
      });
      if (!item) throw new Error("Item tidak ditemukan.");
      if (item.status === "CANCELLED") {
        throw new Error("Item sudah dibatalkan.");
      }

      // Cancel item
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          status: "CANCELLED",
          notes: `${item.notes || ""}\n[VOID] ${reason}`.trim(),
        },
      });

      // Recalculate order totals
      const activeItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId, status: { not: "CANCELLED" } },
        include: { modifiers: true },
      });

      const lineItems: OrderLineItem[] = activeItems.map((i) => ({
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        modifierTotal: i.modifiers.reduce(
          (sum, m) => sum + Number(m.price),
          0
        ),
      }));

      const totals = calculateOrderTotal(
        lineItems,
        Number(item.order.taxRate),
        Number(item.order.serviceRate)
      );

      await tx.order.update({
        where: { id: item.orderId },
        data: {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          serviceAmount: totals.serviceAmount,
          totalAmount: totals.totalAmount,
        },
      });

      // Reverse stock for this item
      await reverseStockForItems(tx, [item], item.order.branchId);

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "VOID_ITEM",
          entity: "order_items",
          entityId: orderItemId,
          oldData: { status: item.status },
          newData: { status: "CANCELLED", reason },
          userId: session.user!.id,
          branchId: item.order.branchId,
        },
      });
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/inventory");

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal void item.",
    };
  }
}

// ============================================================
// TRANSFER TABLE
// ============================================================

export async function transferTable(
  input: { orderId: string; newTableId: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = transferTableSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: validated.data.orderId },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "OPEN") {
        throw new Error("Hanya pesanan OPEN yang bisa dipindah meja.");
      }

      // Check new table is available
      const newTable = await tx.table.findUnique({
        where: { id: validated.data.newTableId },
      });
      if (!newTable) throw new Error("Meja tujuan tidak ditemukan.");
      if (newTable.status !== "AVAILABLE") {
        throw new Error(`Meja ${newTable.number} tidak tersedia.`);
      }

      // Release old table
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      // Assign new table
      await tx.order.update({
        where: { id: order.id },
        data: { tableId: validated.data.newTableId },
      });

      await tx.table.update({
        where: { id: validated.data.newTableId },
        data: { status: "OCCUPIED" },
      });
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");

    await logAudit({
      action: "UPDATE",
      entity: "orders",
      entityId: validated.data.orderId,
      newData: { newTableId: validated.data.newTableId },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal pindah meja.",
    };
  }
}

export async function mergeTableOrders(
  input: { sourceOrderId: string; targetOrderId: string }
): Promise<ActionResult<{ targetOrderId: string }>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "table:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = mergeTableSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  if (validated.data.sourceOrderId === validated.data.targetOrderId) {
    return { success: false, error: "Order sumber dan target tidak boleh sama." };
  }

  try {
    const merged = await prisma.$transaction(async (tx) => {
      const [sourceOrder, targetOrder] = await Promise.all([
        tx.order.findUnique({
          where: { id: validated.data.sourceOrderId },
          include: {
            table: true,
            items: {
              include: { modifiers: true },
            },
          },
        }),
        tx.order.findUnique({
          where: { id: validated.data.targetOrderId },
          include: {
            table: true,
          },
        }),
      ]);

      if (!sourceOrder) throw new Error("Order sumber tidak ditemukan.");
      if (!targetOrder) throw new Error("Order target tidak ditemukan.");

      if (sourceOrder.branchId !== targetOrder.branchId) {
        throw new Error("Order harus berada di cabang yang sama.");
      }

      if (session.user?.branchId && sourceOrder.branchId !== session.user.branchId) {
        throw new Error("Anda tidak memiliki akses order pada cabang ini.");
      }

      if (sourceOrder.status !== "OPEN" || targetOrder.status !== "OPEN") {
        throw new Error("Hanya order OPEN yang bisa digabungkan.");
      }

      if (!sourceOrder.tableId || !targetOrder.tableId) {
        throw new Error("Merge hanya bisa untuk order dine-in yang memiliki meja.");
      }

      if (sourceOrder.tableId === targetOrder.tableId) {
        throw new Error("Order sudah berada di meja yang sama.");
      }

      const sourceActiveItems = sourceOrder.items.filter(
        (item) => item.status !== "CANCELLED"
      );
      if (sourceActiveItems.length === 0) {
        throw new Error("Order sumber tidak memiliki item aktif untuk digabung.");
      }

      await tx.orderItem.updateMany({
        where: {
          orderId: sourceOrder.id,
          status: { not: "CANCELLED" },
        },
        data: {
          orderId: targetOrder.id,
        },
      });

      const mergedItems = await tx.orderItem.findMany({
        where: {
          orderId: targetOrder.id,
          status: { not: "CANCELLED" },
        },
        include: {
          modifiers: true,
        },
      });

      const totals = calculateOrderTotal(
        mergedItems.map((item) => ({
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          modifierTotal: item.modifiers.reduce(
            (sum, modifier) => sum + Number(modifier.price),
            0
          ),
        })),
        Number(targetOrder.taxRate),
        Number(targetOrder.serviceRate)
      );

      const mergedNotes = [
        targetOrder.notes,
        `[MERGE] Item dari ${sourceOrder.orderNumber}`,
      ]
        .filter(Boolean)
        .join("\n");

      await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          serviceAmount: totals.serviceAmount,
          totalAmount: totals.totalAmount,
          notes: mergedNotes || null,
          customerName: targetOrder.customerName || sourceOrder.customerName,
          customerPhone: targetOrder.customerPhone || sourceOrder.customerPhone,
        },
      });

      const sourceNotes = [sourceOrder.notes, `[MERGED_TO] ${targetOrder.orderNumber}`]
        .filter(Boolean)
        .join("\n");

      await tx.order.update({
        where: { id: sourceOrder.id },
        data: {
          status: "VOID",
          subtotal: 0,
          taxAmount: 0,
          serviceAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
          notes: sourceNotes || null,
        },
      });

      await tx.table.update({
        where: { id: sourceOrder.tableId },
        data: { status: "AVAILABLE" },
      });

      return {
        branchId: sourceOrder.branchId,
        sourceOrderId: sourceOrder.id,
        sourceTableId: sourceOrder.tableId,
        targetOrderId: targetOrder.id,
      };
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/tables");
    revalidatePath("/dashboard/kitchen");

    await logAudit({
      action: "UPDATE",
      entity: "orders",
      entityId: merged.sourceOrderId,
      newData: {
        mergedToOrderId: merged.targetOrderId,
      },
      userId: session.user.id,
      branchId: merged.branchId,
    });

    notifyOrderUpdated(merged.branchId, {
      orderId: merged.sourceOrderId,
      status: "VOID",
      mergedToOrderId: merged.targetOrderId,
    });
    notifyOrderUpdated(merged.branchId, {
      orderId: merged.targetOrderId,
      status: "OPEN",
      mergedFromOrderId: merged.sourceOrderId,
    });
    notifyTableStatusChange(merged.branchId, {
      tableId: merged.sourceTableId,
      status: "AVAILABLE",
    });

    return {
      success: true,
      data: {
        targetOrderId: merged.targetOrderId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menggabungkan meja.",
    };
  }
}

// ============================================================
// QR ORDER APPROVAL
// ============================================================

export async function approveQrOrder(
  input: { orderId: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "qr_order:approve")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = approveQrOrderSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const approvalResult = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: validated.data.orderId },
        include: {
          items: {
            include: { modifiers: true },
            where: { status: { not: "CANCELLED" } },
          },
          table: true,
        },
      });

      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "PENDING_APPROVAL") {
        throw new Error("Pesanan ini tidak menunggu approval.");
      }

      let approvedOrderId = order.id;
      let approvedOrderNumber = order.orderNumber;
      let merged = false;

      const activeShift = await tx.shift.findFirst({
        where: {
          userId: session.user!.id,
          branchId: order.branchId,
          closedAt: null,
        },
        orderBy: { openedAt: "desc" },
      });

      if (!activeShift) {
        throw new Error("Buka shift terlebih dahulu untuk approve pesanan QR.");
      }

      const existingOpenOrder = order.tableId
        ? await tx.order.findFirst({
            where: {
              tableId: order.tableId,
              status: "OPEN",
            },
            include: {
              items: {
                where: { status: { not: "CANCELLED" } },
                include: { modifiers: true },
              },
            },
          })
        : null;

      if (existingOpenOrder) {
        merged = true;
        approvedOrderId = existingOpenOrder.id;
        approvedOrderNumber = existingOpenOrder.orderNumber;

        for (const item of order.items) {
          await tx.orderItem.create({
            data: {
              orderId: existingOpenOrder.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              notes: item.notes,
              status: "PENDING",
              station: item.station,
              modifiers: {
                create: item.modifiers.map((modifier) => ({
                  modifierId: modifier.modifierId,
                  name: modifier.name,
                  price: Number(modifier.price),
                })),
              },
            },
          });
        }

        const allItems = await tx.orderItem.findMany({
          where: {
            orderId: existingOpenOrder.id,
            status: { not: "CANCELLED" },
          },
          include: { modifiers: true },
        });

        const allLineItems: OrderLineItem[] = allItems.map((item) => ({
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          modifierTotal: item.modifiers.reduce((sum, modifier) => sum + Number(modifier.price), 0),
        }));

        const totals = calculateOrderTotal(
          allLineItems,
          Number(existingOpenOrder.taxRate),
          Number(existingOpenOrder.serviceRate)
        );

        await tx.order.update({
          where: { id: existingOpenOrder.id },
          data: {
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            serviceAmount: totals.serviceAmount,
            totalAmount: totals.totalAmount,
            customerName: existingOpenOrder.customerName || order.customerName,
            customerPhone: existingOpenOrder.customerPhone || order.customerPhone,
          },
        });

        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { status: "CANCELLED" },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "VOID",
            notes:
              `${order.notes || ""}\n[APPROVED] Digabung ke ${existingOpenOrder.orderNumber}`.trim(),
          },
        });
      } else {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "OPEN",
            shiftId: activeShift.id,
          },
        });
      }

      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "WAITING_FOOD" },
        });
      }

      return {
        branchId: order.branchId,
        tableId: order.tableId,
        merged,
        approvedOrderId,
        approvedOrderNumber,
      };
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/tables");

    await logAudit({
      action: "UPDATE",
      entity: "orders",
      entityId: validated.data.orderId,
      newData: {
        approval: "approved",
      },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    notifyOrderUpdated(approvalResult.branchId, {
      orderId: validated.data.orderId,
      approval: "approved",
      merged: approvalResult.merged,
      activeOrderId: approvalResult.approvedOrderId,
      activeOrderNumber: approvalResult.approvedOrderNumber,
    });

    notifyNewOrder(approvalResult.branchId, {
      orderId: approvalResult.approvedOrderId,
      orderNumber: approvalResult.approvedOrderNumber,
      source: "qr-approval",
      merged: approvalResult.merged,
    });

    if (approvalResult.tableId) {
      notifyTableStatusChange(approvalResult.branchId, {
        tableId: approvalResult.tableId,
        status: "WAITING_FOOD",
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal approve pesanan QR.",
    };
  }
}

export async function rejectQrOrder(
  input: { orderId: string; reason: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "qr_order:approve")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const validated = rejectQrOrderSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const rejectResult = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: validated.data.orderId },
      });

      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status !== "PENDING_APPROVAL") {
        throw new Error("Pesanan ini tidak menunggu approval.");
      }

      let nextTableStatus = "AVAILABLE";

      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: "CANCELLED" },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          notes: `${order.notes || ""}\n[REJECTED] ${validated.data.reason}`.trim(),
        },
      });

      if (order.tableId) {
        const hasAnotherActiveOrder = await tx.order.findFirst({
          where: {
            tableId: order.tableId,
            status: { in: ACTIVE_TABLE_ORDER_STATUSES },
            id: { not: order.id },
          },
        });

        if (!hasAnotherActiveOrder) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: "AVAILABLE" },
          });
          nextTableStatus = "AVAILABLE";
        } else if (hasAnotherActiveOrder.status === "OPEN") {
          nextTableStatus = "OCCUPIED";
        } else {
          nextTableStatus = "WAITING_FOOD";
        }
      }

      return {
        branchId: order.branchId,
        tableId: order.tableId,
        nextTableStatus,
      };
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/tables");

    await logAudit({
      action: "UPDATE",
      entity: "orders",
      entityId: validated.data.orderId,
      newData: {
        approval: "rejected",
        reason: validated.data.reason,
      },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    notifyOrderUpdated(rejectResult.branchId, {
      orderId: validated.data.orderId,
      approval: "rejected",
      reason: validated.data.reason,
    });

    if (rejectResult.tableId) {
      notifyTableStatusChange(rejectResult.branchId, {
        tableId: rejectResult.tableId,
        status: rejectResult.nextTableStatus,
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menolak pesanan QR.",
    };
  }
}

// ============================================================
// HELPER: Deduct stock based on Bill of Materials (BoM)
// ============================================================

async function deductStockForItems(
  tx: Prisma.TransactionClient,
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  branchId: string
) {
  for (const item of items) {
    // Get recipes (BoM) for this product
    const recipes = await tx.recipe.findMany({
      where: { productId: item.productId },
    });

    for (const recipe of recipes) {
      const deductQty = Number(recipe.quantity) * item.quantity;

      // Atomic decrement
      await tx.ingredient.update({
        where: { id: recipe.ingredientId },
        data: {
          currentStock: { decrement: deductQty },
        },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          type: "OUT",
          quantity: deductQty,
          notes: `Auto-deduct: Order item (${item.quantity}x)`,
          ingredientId: recipe.ingredientId,
          branchId,
        },
      });
    }
  }
}

async function reverseStockForItems(
  tx: Prisma.TransactionClient,
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  branchId: string
) {
  for (const item of items) {
    const recipes = await tx.recipe.findMany({
      where: { productId: item.productId },
    });

    for (const recipe of recipes) {
      const restoreQty = Number(recipe.quantity) * item.quantity;

      // Atomic increment (restore)
      await tx.ingredient.update({
        where: { id: recipe.ingredientId },
        data: {
          currentStock: { increment: restoreQty },
        },
      });

      // Record stock reversal
      await tx.stockMovement.create({
        data: {
          type: "ADJUSTMENT",
          quantity: restoreQty,
          notes: `Stock reversal: Cancelled/Void item`,
          ingredientId: recipe.ingredientId,
          branchId,
        },
      });
    }
  }
}
