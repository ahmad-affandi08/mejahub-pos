import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const email = validated.data.email.trim().toLowerCase();
        const { password } = validated.data;
        const clientIp =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const rateLimitKey = `login:${clientIp}:${email}`;
        const rateLimit = checkRateLimit(rateLimitKey, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });

        if (!rateLimit.allowed) {
          throw new Error("Terlalu banyak percobaan login. Coba lagi nanti.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            branchId: true,
            isActive: true,
            image: true,
          },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcryptjs.compare(password, user.password);
        if (!passwordMatch) return null;

        clearRateLimit(rateLimitKey);

        void prisma.auditLog.create({
          data: {
            action: "LOGIN",
            entity: "users",
            entityId: user.id,
            newData: { email: user.email },
            ipAddress: clientIp,
            userAgent: request.headers.get("user-agent"),
            userId: user.id,
            branchId: user.branchId,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
        token.branchId = (user as { branchId: string | null }).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.branchId = token.branchId as string | null;
      }
      return session;
    },
  },
});
