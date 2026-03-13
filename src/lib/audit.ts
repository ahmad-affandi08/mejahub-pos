import prisma from "@/lib/prisma";
import { getRequestMeta } from "@/lib/security";
import type { AuditAction } from "@prisma/client";

interface AuditPayload {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  userId: string;
  branchId?: string | null;
}

function serializeAuditData(value: unknown) {
  if (value == null) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function logAudit(payload: AuditPayload) {
  try {
    const { ipAddress, userAgent } = await getRequestMeta();

    await prisma.auditLog.create({
      data: {
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        oldData: serializeAuditData(payload.oldData),
        newData: serializeAuditData(payload.newData),
        ipAddress,
        userAgent,
        userId: payload.userId,
        branchId: payload.branchId,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
