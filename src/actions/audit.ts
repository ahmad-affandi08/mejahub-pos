"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function getAuditLogs(filters?: {
  action?: string;
  entity?: string;
  userId?: string;
}) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "audit:view")) {
    throw new Error("Unauthorized");
  }

  const branchId = session.user.branchId;
  const where: Record<string, unknown> = {};

  if (branchId) {
    where.OR = [{ branchId }, { branchId: null }];
  }

  if (filters?.action && filters.action !== "ALL") {
    where.action = filters.action;
  }

  if (filters?.entity && filters.entity !== "ALL") {
    where.entity = filters.entity;
  }

  if (filters?.userId && filters.userId !== "ALL") {
    where.userId = filters.userId;
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
