import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generic server action result type
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to format Prisma errors into user-friendly messages
 */
export function formatPrismaError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return "Data sudah ada. Periksa kembali input Anda.";
    }
    if (error.message.includes("Foreign key constraint")) {
      return "Data terkait tidak ditemukan.";
    }
    return error.message;
  }
  return "Terjadi kesalahan yang tidak diketahui.";
}

/**
 * Generate order number: ORD-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${dateStr}-${random}`;
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

