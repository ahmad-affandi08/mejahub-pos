"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { registerSchema } from "@/lib/validations/auth";
import bcryptjs from "bcryptjs";
import type { ActionResult } from "@/lib/utils";
import type { User } from "@prisma/client";

type SafeUser = Omit<User, "password">;

export async function getUsers(branchId?: string): Promise<SafeUser[]> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "user:manage")) {
    throw new Error("Unauthorized");
  }

  const where: Record<string, unknown> = {};
  if (session.user.role !== "SUPER_ADMIN") {
    where.branchId = session.user.branchId;
  } else if (branchId) {
    where.branchId = branchId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      pin: true,
      isActive: true,
      branchId: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return users as SafeUser[];
}

export async function createUser(
  formData: FormData
): Promise<ActionResult<SafeUser>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "user:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = registerSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const hashedPassword = await bcryptjs.hash(validated.data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...validated.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        pin: true,
        isActive: true,
        branchId: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user as SafeUser };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat user.",
    };
  }
}

export async function updateUser(
  id: string,
  formData: FormData
): Promise<ActionResult<SafeUser>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "user:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const updateData: Record<string, unknown> = {};

  if (raw.name) updateData.name = raw.name;
  if (raw.email) updateData.email = raw.email;
  if (raw.role) updateData.role = raw.role;
  if (raw.branchId) updateData.branchId = raw.branchId;
  if (raw.pin) updateData.pin = raw.pin;
  if (raw.password && String(raw.password).length >= 6) {
    updateData.password = await bcryptjs.hash(String(raw.password), 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        pin: true,
        isActive: true,
        branchId: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: user as SafeUser };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update user.",
    };
  }
}

export async function toggleUserActive(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "user:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "User tidak ditemukan." };

    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update user.",
    };
  }
}
