"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
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
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    role: UserRole;
    branchId: string | null;
  };
}

const navItems = [
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
    title: "Inventori",
    href: "/dashboard/inventory",
    icon: Warehouse,
    permission: "inventory:view" as const,
  },
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

  const filteredItems = navItems.filter((item) =>
    hasPermission(user.role, item.permission)
  );

  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">MH</span>
        </div>
        <span className="text-lg font-bold">MejaHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
