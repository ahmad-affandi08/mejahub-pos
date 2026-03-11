import type { UserRole } from "@prisma/client";

/**
 * Role-Based Access Control (RBAC) utility
 * Defines which roles can access which features/routes
 */

type Permission =
  | "dashboard:view"
  | "branch:manage"
  | "user:manage"
  | "product:manage"
  | "category:manage"
  | "table:manage"
  | "table:view"
  | "order:create"
  | "order:view"
  | "order:void"
  | "order:cancel"
  | "payment:process"
  | "payment:refund"
  | "kds:view"
  | "kds:update"
  | "inventory:manage"
  | "inventory:view"
  | "shift:manage"
  | "shift:view"
  | "report:view"
  | "report:export"
  | "audit:view"
  | "settings:manage"
  | "qr_order:approve";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "branch:manage",
    "user:manage",
    "product:manage",
    "category:manage",
    "table:manage",
    "table:view",
    "order:create",
    "order:view",
    "order:void",
    "order:cancel",
    "payment:process",
    "payment:refund",
    "kds:view",
    "kds:update",
    "inventory:manage",
    "inventory:view",
    "shift:manage",
    "shift:view",
    "report:view",
    "report:export",
    "audit:view",
    "settings:manage",
    "qr_order:approve",
  ],
  BRANCH_MANAGER: [
    "dashboard:view",
    "user:manage",
    "product:manage",
    "category:manage",
    "table:manage",
    "table:view",
    "order:create",
    "order:view",
    "order:void",
    "order:cancel",
    "payment:process",
    "payment:refund",
    "kds:view",
    "kds:update",
    "inventory:manage",
    "inventory:view",
    "shift:manage",
    "shift:view",
    "report:view",
    "report:export",
    "audit:view",
    "qr_order:approve",
  ],
  CASHIER: [
    "dashboard:view",
    "table:view",
    "table:manage",
    "order:create",
    "order:view",
    "order:cancel",
    "payment:process",
    "shift:manage",
    "shift:view",
    "qr_order:approve",
  ],
  WAITER: [
    "dashboard:view",
    "table:view",
    "order:create",
    "order:view",
    "kds:view",
    "qr_order:approve",
  ],
  KITCHEN_STAFF: [
    "kds:view",
    "kds:update",
  ],
  BAR_STAFF: [
    "kds:view",
    "kds:update",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export type { Permission };
