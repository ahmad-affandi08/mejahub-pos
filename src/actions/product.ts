"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import {
  attachProductModifierGroupSchema,
  createProductModifierGroupSchema,
  modifierSchema,
  productSchema,
  productVariantSchema,
  updateModifierGroupSchema,
  updateModifierSchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "@/lib/validations/product";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import type {
  Modifier,
  ModifierGroup,
  Product,
  ProductModifierGroup,
  ProductVariant,
} from "@prisma/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_DIR = join(process.cwd(), "public", "uploads", "products");

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function getExtensionFromFile(file: File): string {
  const mimeExt = MIME_EXTENSION_MAP[file.type];
  if (mimeExt) return mimeExt;

  const match = file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);
  if (!match) return ".jpg";
  return match[1] === "jpeg" ? ".jpg" : `.${match[1]}`;
}

async function saveProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5MB.");
  }

  await mkdir(PRODUCT_IMAGE_DIR, { recursive: true });

  const extension = getExtensionFromFile(file);
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = join(PRODUCT_IMAGE_DIR, fileName);
  const relativePath = `/uploads/products/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);
  return relativePath;
}

async function deleteProductImage(imagePath?: string | null) {
  if (!imagePath) return;

  const normalized = imagePath.replace(/\\/g, "/");
  if (!normalized.startsWith("/uploads/products/") || normalized.includes("..")) {
    return;
  }

  const absolutePath = join(process.cwd(), "public", normalized.slice(1));

  try {
    await unlink(absolutePath);
  } catch {
    // ignore missing file
  }
}

export async function getProducts(branchId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetBranchId = branchId || session.user.branchId;
  if (!targetBranchId) return [];

  return prisma.product.findMany({
    where: { branchId: targetBranchId, isActive: true },
    include: {
      category: true,
      variants: { where: { isActive: true } },
      modifierGroups: {
        include: {
          modifierGroup: {
            include: {
              modifiers: { where: { isActive: true } },
            },
          },
        },
      },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { where: { isActive: true } },
      modifierGroups: {
        include: {
          modifierGroup: {
            include: {
              modifiers: { where: { isActive: true } },
            },
          },
        },
      },
      recipes: {
        include: { ingredient: true },
      },
    },
  });
}

export async function createProduct(
  formData: FormData
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = productSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  let uploadedImagePath: string | null = null;

  try {
    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      uploadedImagePath = await saveProductImage(imageFile);
    }

    const product = await prisma.product.create({
      data: {
        ...validated.data,
        image: uploadedImagePath,
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "products",
      entityId: product.id,
      newData: product,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (uploadedImagePath) {
      await deleteProductImage(uploadedImagePath);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat produk.",
    };
  }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateProductSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  let uploadedImagePath: string | null = null;
  let previousImagePath: string | null = null;

  try {
    const previous = await prisma.product.findUnique({ where: { id } });
    if (!previous) {
      return { success: false, error: "Produk tidak ditemukan." };
    }
    previousImagePath = previous.image;

    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      uploadedImagePath = await saveProductImage(imageFile);
    }

    const removeImage = formData.get("removeImage") === "true";
    let nextImage = previous.image;

    if (removeImage) {
      nextImage = null;
    }

    if (uploadedImagePath) {
      nextImage = uploadedImagePath;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...validated.data,
        image: nextImage,
      },
    });

    if ((removeImage || uploadedImagePath) && previous.image) {
      await deleteProductImage(previous.image);
    }

    await logAudit({
      action: "UPDATE",
      entity: "products",
      entityId: product.id,
      oldData: previous,
      newData: product,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (uploadedImagePath && uploadedImagePath !== previousImagePath) {
      await deleteProductImage(uploadedImagePath);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update produk.",
    };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const previous = await prisma.product.findUnique({ where: { id } });
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: "DELETE",
      entity: "products",
      entityId: id,
      oldData: previous,
      newData: { isActive: false },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus produk.",
    };
  }
}

export async function toggleProductAvailability(
  id: string
): Promise<ActionResult<Product>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable: !product.isAvailable },
    });

    await logAudit({
      action: "UPDATE",
      entity: "products",
      entityId: updated.id,
      oldData: { isAvailable: product.isAvailable },
      newData: { isAvailable: updated.isAvailable },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update produk.",
    };
  }
}

export async function createProductVariant(
  formData: FormData
): Promise<ActionResult<ProductVariant>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = productVariantSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const variant = await prisma.productVariant.create({
      data: validated.data,
    });

    await logAudit({
      action: "CREATE",
      entity: "product_variants",
      entityId: variant.id,
      newData: variant,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat varian.",
    };
  }
}

export async function updateProductVariant(
  id: string,
  formData: FormData
): Promise<ActionResult<ProductVariant>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateProductVariantSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const previous = await prisma.productVariant.findUnique({ where: { id } });
    const variant = await prisma.productVariant.update({
      where: { id },
      data: validated.data,
    });

    await logAudit({
      action: "UPDATE",
      entity: "product_variants",
      entityId: variant.id,
      oldData: previous,
      newData: variant,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update varian.",
    };
  }
}

export async function deleteProductVariant(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const previous = await prisma.productVariant.findUnique({ where: { id } });
    await prisma.productVariant.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: "DELETE",
      entity: "product_variants",
      entityId: id,
      oldData: previous,
      newData: { isActive: false },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus varian.",
    };
  }
}

export async function createProductModifierGroup(
  formData: FormData
): Promise<
  ActionResult<
    ProductModifierGroup & {
      modifierGroup: ModifierGroup & { modifiers: Modifier[] };
    }
  >
> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = createProductModifierGroupSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.modifierGroup.create({
        data: {
          name: validated.data.name,
          type: validated.data.type,
          isRequired: validated.data.isRequired,
          minSelect: validated.data.minSelect,
          maxSelect: validated.data.maxSelect,
        },
      });

      const junction = await tx.productModifierGroup.create({
        data: {
          productId: validated.data.productId,
          modifierGroupId: group.id,
        },
        include: {
          modifierGroup: {
            include: {
              modifiers: { where: { isActive: true } },
            },
          },
        },
      });

      return junction;
    });

    await logAudit({
      action: "CREATE",
      entity: "product_modifier_groups",
      entityId: result.id,
      newData: {
        productId: validated.data.productId,
        modifierGroupId: result.modifierGroupId,
      },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal membuat modifier group produk.",
    };
  }
}

export async function attachExistingModifierGroup(
  formData: FormData
): Promise<
  ActionResult<
    ProductModifierGroup & {
      modifierGroup: ModifierGroup & { modifiers: Modifier[] };
    }
  >
> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = attachProductModifierGroupSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const existing = await prisma.productModifierGroup.findUnique({
      where: {
        productId_modifierGroupId: {
          productId: validated.data.productId,
          modifierGroupId: validated.data.modifierGroupId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Modifier group sudah terpasang pada produk ini.",
      };
    }

    const result = await prisma.productModifierGroup.create({
      data: {
        productId: validated.data.productId,
        modifierGroupId: validated.data.modifierGroupId,
      },
      include: {
        modifierGroup: {
          include: {
            modifiers: { where: { isActive: true } },
          },
        },
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "product_modifier_groups",
      entityId: result.id,
      newData: {
        productId: validated.data.productId,
        modifierGroupId: validated.data.modifierGroupId,
        attachedExistingGroup: true,
      },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal memasang modifier group ke produk.",
    };
  }
}

export async function updateModifierGroup(
  id: string,
  formData: FormData
): Promise<ActionResult<ModifierGroup>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateModifierGroupSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const previous = await prisma.modifierGroup.findUnique({ where: { id } });
    const group = await prisma.modifierGroup.update({
      where: { id },
      data: validated.data,
    });

    await logAudit({
      action: "UPDATE",
      entity: "modifier_groups",
      entityId: group.id,
      oldData: previous,
      newData: group,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal update modifier group.",
    };
  }
}

export async function removeProductModifierGroup(
  productId: string,
  modifierGroupId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    await prisma.productModifierGroup.delete({
      where: {
        productId_modifierGroupId: {
          productId,
          modifierGroupId,
        },
      },
    });

    await logAudit({
      action: "DELETE",
      entity: "product_modifier_groups",
      newData: { productId, modifierGroupId, unlinked: true },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal melepas modifier group dari produk.",
    };
  }
}

export async function createModifier(
  formData: FormData
): Promise<ActionResult<Modifier>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = modifierSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const modifier = await prisma.modifier.create({
      data: validated.data,
    });

    await logAudit({
      action: "CREATE",
      entity: "modifiers",
      entityId: modifier.id,
      newData: modifier,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat modifier.",
    };
  }
}

export async function updateModifier(
  id: string,
  formData: FormData
): Promise<ActionResult<Modifier>> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateModifierSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const previous = await prisma.modifier.findUnique({ where: { id } });
    const modifier = await prisma.modifier.update({
      where: { id },
      data: validated.data,
    });

    await logAudit({
      action: "UPDATE",
      entity: "modifiers",
      entityId: modifier.id,
      oldData: previous,
      newData: modifier,
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal update modifier.",
    };
  }
}

export async function deleteModifier(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "product:manage")) {
    return { success: false, error: "Anda tidak memiliki akses." };
  }

  try {
    const previous = await prisma.modifier.findUnique({ where: { id } });
    await prisma.modifier.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: "DELETE",
      entity: "modifiers",
      entityId: id,
      oldData: previous,
      newData: { isActive: false },
      userId: session.user.id,
      branchId: session.user.branchId,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus modifier.",
    };
  }
}
