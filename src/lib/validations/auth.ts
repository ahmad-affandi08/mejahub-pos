import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum([
    "SUPER_ADMIN",
    "BRANCH_MANAGER",
    "CASHIER",
    "WAITER",
    "KITCHEN_STAFF",
    "BAR_STAFF",
  ]),
  branchId: z.string().optional(),
  pin: z.string().min(4).max(6).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
