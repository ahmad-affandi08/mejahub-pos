import { headers } from "next/headers";

export function sanitizeText(value: string, maxLength = 500): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: string, maxLength = 2000): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export async function getRequestMeta() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const realIp = requestHeaders.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || null,
    userAgent: requestHeaders.get("user-agent") || null,
  };
}

export async function getClientFingerprint(prefix: string, extra = "") {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const realIp = requestHeaders.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return `${prefix}:${ip}${extra ? `:${extra}` : ""}`;
}
