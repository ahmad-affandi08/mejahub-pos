import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    branchId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      branchId: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    branchId: string | null;
  }
}
