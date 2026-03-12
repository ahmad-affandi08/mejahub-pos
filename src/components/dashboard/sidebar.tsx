"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  Package,
  Users,
  Building2,
  ClipboardList,
  ChefHat,
  BarChart3,
  Settings,
  ShieldCheck,
  Warehouse,
  Plus,
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    role: UserRole;
    branchId: string | null;
  };
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:view" as const,
  },
  {
    title: "Meja",
    href: "/dashboard/tables",
    icon: Grid3X3,
    permission: "table:view" as const,
  },
  {
    title: "Pesanan",
    href: "/dashboard/orders",
    icon: ClipboardList,
    permission: "order:view" as const,
  },
  {
    title: "Dapur (KDS)",
    href: "/dashboard/kitchen",
    icon: ChefHat,
    permission: "kds:view" as const,
  },
  {
    title: "Produk",
    href: "/dashboard/products",
    icon: UtensilsCrossed,
    permission: "product:manage" as const,
  },
  {
    title: "Kategori",
    href: "/dashboard/categories",
    icon: Package,
    permission: "category:manage" as const,
  },
  {
    title: "Inventori",
    href: "/dashboard/inventory",
    icon: Warehouse,
    permission: "inventory:view" as const,
  },
];

const managementNavItems = [
  {
    title: "Pengguna",
    href: "/dashboard/users",
    icon: Users,
    permission: "user:manage" as const,
  },
  {
    title: "Cabang",
    href: "/dashboard/branches",
    icon: Building2,
    permission: "branch:manage" as const,
  },
  {
    title: "Laporan",
    href: "/dashboard/reports",
    icon: BarChart3,
    permission: "report:view" as const,
  },
  {
    title: "Audit Log",
    href: "/dashboard/audit",
    icon: ShieldCheck,
    permission: "audit:view" as const,
  },
  {
    title: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
    permission: "settings:manage" as const,
  },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const filteredMain = mainNavItems.filter((item) =>
    hasPermission(user.role, item.permission)
  );
  const filteredManagement = managementNavItems.filter((item) =>
    hasPermission(user.role, item.permission)
  );

  return (
    <aside className="hidden w-60 flex-col bg-primary lg:flex rounded-tr-[100px]  overflow-hidden">
      <div className="px-4 pb-4">
        <Separator className="mb-3" />
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Cabang Aktif
            </span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {user.branchId ? "Cabang Utama" : "Semua Cabang"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user.role.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="space-y-0.5">
          {filteredMain.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary text-primary font-semibold"
                    : "text-foreground/70 hover:bg-secondary hover:text-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isActive ? "text-primary" : "text-foreground/50",
                    "transition-colors group-hover:text-primary"
                  )}
                />
                {item.title}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        {filteredManagement.length > 0 && (
          <>
            <Separator className="my-3" />

            <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Manajemen
            </p>

            <div className="space-y-0.5">
              {filteredManagement.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-4 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-secondary text-primary font-semibold"
                        : "text-foreground/70 hover:bg-secondary hover:text-primary"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        isActive ? "text-primary" : "text-foreground/50",
                        "transition-colors group-hover:text-primary"
                      )}
                    />
                    {item.title}
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
