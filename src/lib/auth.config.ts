import type { NextAuthConfig } from "next-auth";

/**
 * Auth configuration used by middleware for edge-compatible route protection.
 * This file should NOT import Prisma or any Node.js-only modules.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname === "/login";
      const isOnPublicOrder = nextUrl.pathname.startsWith("/order"); // QR ordering

      // Public routes: login, QR ordering, API health
      if (isOnPublicOrder) return true;

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;
