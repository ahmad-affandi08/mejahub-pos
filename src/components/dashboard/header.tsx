"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell, Search, HelpCircle, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { UserRole } from "@prisma/client";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
}

const roleBadgeVariant: Record<
  UserRole,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SUPER_ADMIN: "destructive",
  BRANCH_MANAGER: "default",
  CASHIER: "secondary",
  WAITER: "secondary",
  KITCHEN_STAFF: "outline",
  BAR_STAFF: "outline",
};

export function DashboardHeader({ user }: HeaderProps) {
  return (
    <header className="flex h-20 items-center gap-4 bg-background px-4 lg:px-6">
      {/* Logo - visible on all screens, sits in header like Google Drive */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Logo />
      </div>

      {/* Search Bar - centered, Google Drive style */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari menu, pesanan, meja..."
            className="h-11 w-full rounded-full border-0 bg-muted/90 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:bg-muted focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Badge
          variant={roleBadgeVariant[user.role]}
          className="mr-2 hidden md:inline-flex rounded-full px-3 py-0.5 text-[11px]"
        >
          {user.role.replace(/_/g, " ")}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-foreground/60 hover:bg-muted"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-foreground/60 hover:bg-muted"
        >
          <Settings className="h-4.5 w-4.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-foreground/60 hover:bg-muted"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pl-3 pr-1 ml-1 hover:bg-muted transition-colors">
            <span className="hidden text-sm font-medium md:inline-block text-foreground/80">
              {user.name}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer">
              <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg py-2.5 text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
