"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export type ReportPreset = "today" | "7d" | "30d" | "90d" | "mtd" | "ytd" | "custom";

export interface ReportFilters {
  preset?: string;
  from?: string;
  to?: string;
}

interface DateRangeResult {
  preset: ReportPreset;
  start: Date;
  endExclusive: Date;
  fromIso: string;
  toIso: string;
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function safeNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number(String(value));
  }
  return 0;
}

function parseDateInput(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function resolveDateRange(filters?: ReportFilters): DateRangeResult {
  const now = new Date();
  const todayStart = startOfDay(now);

  const presetInput = filters?.preset;
  const preset: ReportPreset =
    presetInput === "today" ||
    presetInput === "7d" ||
    presetInput === "30d" ||
    presetInput === "90d" ||
    presetInput === "mtd" ||
    presetInput === "ytd" ||
    presetInput === "custom"
      ? presetInput
      : "30d";

  if (preset === "custom") {
    const from = parseDateInput(filters?.from);
    const to = parseDateInput(filters?.to);

    if (from && to && from <= to) {
      const endExclusive = addDays(to, 1);
      return {
        preset,
        start: from,
        endExclusive,
        fromIso: getDateKey(from),
        toIso: getDateKey(to),
        label: `${formatDateOnly(from)} - ${formatDateOnly(to)}`,
      };
    }
  }

  if (preset === "today") {
    const endExclusive = addDays(todayStart, 1);
    return {
      preset,
      start: todayStart,
      endExclusive,
      fromIso: getDateKey(todayStart),
      toIso: getDateKey(todayStart),
      label: `Hari ini (${formatDateOnly(todayStart)})`,
    };
  }

  if (preset === "7d") {
    const start = addDays(todayStart, -6);
    return {
      preset,
      start,
      endExclusive: addDays(todayStart, 1),
      fromIso: getDateKey(start),
      toIso: getDateKey(todayStart),
      label: "7 hari terakhir",
    };
  }

  if (preset === "90d") {
    const start = addDays(todayStart, -89);
    return {
      preset,
      start,
      endExclusive: addDays(todayStart, 1),
      fromIso: getDateKey(start),
      toIso: getDateKey(todayStart),
      label: "90 hari terakhir",
    };
  }

  if (preset === "mtd") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      preset,
      start,
      endExclusive: addDays(todayStart, 1),
      fromIso: getDateKey(start),
      toIso: getDateKey(todayStart),
      label: "Month to date",
    };
  }

  if (preset === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      preset,
      start,
      endExclusive: addDays(todayStart, 1),
      fromIso: getDateKey(start),
      toIso: getDateKey(todayStart),
      label: "Year to date",
    };
  }

  const start = addDays(todayStart, -29);
  return {
    preset: "30d",
    start,
    endExclusive: addDays(todayStart, 1),
    fromIso: getDateKey(start),
    toIso: getDateKey(todayStart),
    label: "30 hari terakhir",
  };
}

export async function getReportData(filters?: ReportFilters) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "report:view")) {
    throw new Error("Unauthorized");
  }

  const branchId = session.user.branchId;
  const range = resolveDateRange(filters);

  const scopedOrderWhere = {
    ...(branchId ? { branchId } : {}),
    createdAt: { gte: range.start, lt: range.endExclusive },
  };

  const [orders, orderItems, payments] = await Promise.all([
    prisma.order.findMany({
      where: scopedOrderWhere,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        serviceAmount: true,
        customerName: true,
        customerPhone: true,
        createdAt: true,
        userId: true,
        tableId: true,
        user: { select: { id: true, name: true } },
        table: { select: { id: true, number: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          ...(branchId ? { branchId } : {}),
          status: "PAID",
          createdAt: { gte: range.start, lt: range.endExclusive },
        },
      },
      select: {
        orderId: true,
        productId: true,
        quantity: true,
        subtotal: true,
        product: {
          select: {
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        order: {
          ...(branchId ? { branchId } : {}),
          createdAt: { gte: range.start, lt: range.endExclusive },
        },
      },
      select: {
        method: true,
        amount: true,
        orderId: true,
      },
    }),
  ]);

  const totalOrders = orders.length;
  const paidOrders = orders.filter((order) => order.status === "PAID");
  const paidOrderCount = paidOrders.length;
  const voidOrCancelledCount = orders.filter(
    (order) => order.status === "VOID" || order.status === "CANCELLED"
  ).length;

  const totalRevenue = paidOrders.reduce((sum, order) => sum + safeNumber(order.totalAmount), 0);
  const totalSubtotal = paidOrders.reduce((sum, order) => sum + safeNumber(order.subtotal), 0);
  const totalDiscount = paidOrders.reduce((sum, order) => sum + safeNumber(order.discountAmount), 0);
  const totalTax = paidOrders.reduce((sum, order) => sum + safeNumber(order.taxAmount), 0);
  const totalService = paidOrders.reduce((sum, order) => sum + safeNumber(order.serviceAmount), 0);

  const itemsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const avgOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;
  const cancellationRate = totalOrders > 0 ? voidOrCancelledCount / totalOrders : 0;

  const uniqueCustomerSet = new Set(
    paidOrders
      .map((order) => order.customerPhone?.trim() || order.customerName?.trim() || "")
      .filter(Boolean)
  );

  const statusBreakdownMap = new Map<string, number>();
  orders.forEach((order) => {
    statusBreakdownMap.set(order.status, (statusBreakdownMap.get(order.status) ?? 0) + 1);
  });
  const statusBreakdown = Array.from(statusBreakdownMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? count / totalOrders : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const typeBreakdownMap = new Map<string, { count: number; revenue: number }>();
  paidOrders.forEach((order) => {
    const current = typeBreakdownMap.get(order.type) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += safeNumber(order.totalAmount);
    typeBreakdownMap.set(order.type, current);
  });
  const typeBreakdown = Array.from(typeBreakdownMap.entries()).map(([type, value]) => ({
    type,
    count: value.count,
    revenue: value.revenue,
    percentage: totalRevenue > 0 ? value.revenue / totalRevenue : 0,
  }));

  const paymentMap = new Map<string, { count: number; amount: number }>();
  payments.forEach((payment) => {
    const current = paymentMap.get(payment.method) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += safeNumber(payment.amount);
    paymentMap.set(payment.method, current);
  });
  const totalPaymentAmount = Array.from(paymentMap.values()).reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const paymentBreakdown = Array.from(paymentMap.entries())
    .map(([method, value]) => ({
      method,
      count: value.count,
      amount: value.amount,
      percentage: totalPaymentAmount > 0 ? value.amount / totalPaymentAmount : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; orderIds: Set<string> }
  >();
  const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  orderItems.forEach((item) => {
    const productCurrent = productMap.get(item.productId) ?? {
      name: item.product.name,
      quantity: 0,
      revenue: 0,
      orderIds: new Set<string>(),
    };
    productCurrent.quantity += item.quantity;
    productCurrent.revenue += safeNumber(item.subtotal);
    productCurrent.orderIds.add(item.orderId);
    productMap.set(item.productId, productCurrent);

    const categoryId = item.product.category?.id ?? "uncategorized";
    const categoryName = item.product.category?.name ?? "Tanpa Kategori";
    const categoryCurrent = categoryMap.get(categoryId) ?? {
      name: categoryName,
      quantity: 0,
      revenue: 0,
    };
    categoryCurrent.quantity += item.quantity;
    categoryCurrent.revenue += safeNumber(item.subtotal);
    categoryMap.set(categoryId, categoryCurrent);
  });

  const topProducts = Array.from(productMap.entries())
    .map(([id, value]) => ({
      id,
      name: value.name,
      quantity: value.quantity,
      revenue: value.revenue,
      orderCount: value.orderIds.size,
      contribution: totalRevenue > 0 ? value.revenue / totalRevenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  const categoryPerformance = Array.from(categoryMap.entries())
    .map(([id, value]) => ({
      id,
      name: value.name,
      quantity: value.quantity,
      revenue: value.revenue,
      contribution: totalRevenue > 0 ? value.revenue / totalRevenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const staffMap = new Map<string, { name: string; orderCount: number; revenue: number }>();
  paidOrders.forEach((order) => {
    const userId = order.userId;
    const current = staffMap.get(userId) ?? {
      name: order.user?.name ?? "Unknown",
      orderCount: 0,
      revenue: 0,
    };
    current.orderCount += 1;
    current.revenue += safeNumber(order.totalAmount);
    staffMap.set(userId, current);
  });
  const staffPerformance = Array.from(staffMap.entries())
    .map(([id, value]) => ({
      id,
      name: value.name,
      orderCount: value.orderCount,
      revenue: value.revenue,
      averageOrder: value.orderCount > 0 ? value.revenue / value.orderCount : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const tableMap = new Map<string, { label: string; orderCount: number; revenue: number }>();
  paidOrders
    .filter((order) => order.type === "DINE_IN")
    .forEach((order) => {
      const key = order.tableId ?? "unknown";
      const label = order.table
        ? `${order.table.number}${order.table.name ? ` - ${order.table.name}` : ""}`
        : "Tanpa Meja";
      const current = tableMap.get(key) ?? { label, orderCount: 0, revenue: 0 };
      current.orderCount += 1;
      current.revenue += safeNumber(order.totalAmount);
      tableMap.set(key, current);
    });
  const tableUtilization = Array.from(tableMap.entries())
    .map(([id, value]) => ({
      id,
      label: value.label,
      orderCount: value.orderCount,
      revenue: value.revenue,
      contribution: totalRevenue > 0 ? value.revenue / totalRevenue : 0,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 12);

  const dayMap = new Map<string, { date: string; orderCount: number; revenue: number }>();
  for (
    let date = new Date(range.start);
    date < range.endExclusive;
    date = addDays(date, 1)
  ) {
    const key = getDateKey(date);
    dayMap.set(key, {
      date: key,
      orderCount: 0,
      revenue: 0,
    });
  }
  paidOrders.forEach((order) => {
    const key = getDateKey(order.createdAt);
    const current = dayMap.get(key);
    if (!current) return;
    current.orderCount += 1;
    current.revenue += safeNumber(order.totalAmount);
    dayMap.set(key, current);
  });
  const dailyTrend = Array.from(dayMap.values()).map((day) => ({
    ...day,
    dateLabel: formatDateOnly(new Date(`${day.date}T00:00:00`)),
  }));

  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    orderCount: 0,
    revenue: 0,
  }));
  paidOrders.forEach((order) => {
    const hour = order.createdAt.getHours();
    hourlyDistribution[hour].orderCount += 1;
    hourlyDistribution[hour].revenue += safeNumber(order.totalAmount);
  });

  const peakHour = hourlyDistribution.reduce((best, current) =>
    current.revenue > best.revenue ? current : best
  );

  const insights: Array<{ title: string; description: string; tone: "good" | "warn" | "info" }> = [];

  if (cancellationRate >= 0.15) {
    insights.push({
      title: "Tingkat pembatalan tinggi",
      description: `Pembatalan/Void mencapai ${(cancellationRate * 100).toFixed(1)}% dari total order. Tinjau akurasi order-taking dan validasi stok.`,
      tone: "warn",
    });
  }

  if (topProducts[0]) {
    insights.push({
      title: "Produk terlaris",
      description: `${topProducts[0].name} menyumbang ${(topProducts[0].contribution * 100).toFixed(1)}% revenue periode ini.`,
      tone: "good",
    });
  }

  if (paymentBreakdown[0]) {
    insights.push({
      title: "Metode pembayaran dominan",
      description: `${paymentBreakdown[0].method} mendominasi ${(paymentBreakdown[0].percentage * 100).toFixed(1)}% dari total pembayaran.`,
      tone: "info",
    });
  }

  if (peakHour.orderCount > 0) {
    insights.push({
      title: "Jam paling ramai",
      description: `Puncak transaksi di jam ${peakHour.label} dengan ${peakHour.orderCount} order.`,
      tone: "info",
    });
  }

  return {
    branchId,
    range,
    summary: {
      totalOrders,
      paidOrderCount,
      totalRevenue,
      totalSubtotal,
      totalDiscount,
      totalTax,
      totalService,
      avgOrderValue,
      itemsSold,
      uniqueCustomerCount: uniqueCustomerSet.size,
      cancellationRate,
    },
    statusBreakdown,
    typeBreakdown,
    paymentBreakdown,
    topProducts,
    categoryPerformance,
    staffPerformance,
    tableUtilization,
    dailyTrend,
    hourlyDistribution,
    insights,
  };
}
