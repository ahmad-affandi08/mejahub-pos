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
import { LogOut, User, Bell } from "lucide-react";
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
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold lg:hidden">MejaHub</h2>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={roleBadgeVariant[user.role]}>
          {user.role.replace("_", " ")}
        </Badge>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm md:inline-block">
                {user.name}
              </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
