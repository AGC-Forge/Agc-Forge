"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { encrypt, decrypt, isValidApiKey } from "@/lib/encryption";
import {
  updateProfileSchema,
  changePasswordSchema,
  saveApiKeySchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type SaveApiKeyInput,
} from "@/lib/validations/account";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getUserProfileAction() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: true,
      accounts: { select: { provider: true, providerAccountId: true } },
      api_keys: {
        select: {
          id: true,
          provider: true,
          label: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          // Jangan return api_key (encrypted) — hanya metadata
        },
      },
      _count: {
        select: { conversations: true, projects: true },
      },
    },
  });

  if (!user) return { success: false, error: "User not found." };

  // Jangan expose sensitive fields
  const { password_hash, ...safeUser } = user;
  const hasPassword = !!password_hash;

  return {
    success: true,
    data: {
      ...safeUser,
      has_password: hasPassword,
      email_verified: !!user.email_verified_at,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      email_verified_at: user.email_verified_at?.toISOString() ?? null,
      last_login_at: user.last_login_at?.toISOString() ?? null,
      api_keys: user.api_keys.map((k) => ({
        ...k,
        created_at: k.created_at.toISOString(),
        updated_at: k.updated_at.toISOString(),
      })),
    },
  };
}

export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, phone, avatar } = parsed.data;

    // Cek phone sudah dipakai user lain
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: session.user.id } },
      });
      if (existing) {
        return { success: false, error: "Phone number already in use." };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        avatar: avatar || null,
      },
    });

    revalidatePath("/account");
    return { success: true, message: "Profile updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to update profile." };
  }
}

export async function changePasswordAction(
  data: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password_hash: true },
    });

    if (!user?.password_hash) {
      return {
        success: false,
        error: "Account uses social login, no password set.",
      };
    }

    const isValid = await compare(parsed.data.current_password, user.password_hash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect." };
    }

    if (parsed.data.current_password === parsed.data.new_password) {
      return { success: false, error: "New password must be different from current password." };
    }

    const newHash = await hash(parsed.data.new_password, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password_hash: newHash },
    });

    return { success: true, message: "Password updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to update password." };
  }
}

export async function saveApiKeyAction(
  data: SaveApiKeyInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const parsed = saveApiKeySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { provider, api_key, label } = parsed.data;

    if (!isValidApiKey(api_key)) {
      return { success: false, error: "Invalid API key format." };
    }

    // Encrypt sebelum simpan
    const encryptedKey = encrypt(api_key);

    await prisma.userApiKey.upsert({
      where: {
        user_api_key_userId_provider_unique: {
          userId: session.user.id,
          provider,
        },
      },
      create: {
        userId: session.user.id,
        provider,
        api_key: encryptedKey,
        label: label || null,
        is_active: true,
      },
      update: {
        api_key: encryptedKey,
        label: label || null,
        is_active: true,
      },
    });

    revalidatePath("/account");
    return { success: true, message: `API key ${provider} saved successfully.` };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to save API key." };
  }
}

export async function revealApiKeyAction(
  provider: string
): Promise<ActionResult<string>> {
  try {
    const session = await requireAuth();

    const record = await prisma.userApiKey.findUnique({
      where: {
        user_api_key_userId_provider_unique: {
          userId: session.user.id,
          provider,
        },
      },
    });

    if (!record) {
      return { success: false, error: "API key not found." };
    }

    const plaintext = decrypt(record.api_key);
    return { success: true, data: plaintext };
  } catch (err: any) {
    return { success: false, error: "Failed to read API key." };
  }
}

export async function deleteApiKeyAction(
  provider: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    await prisma.userApiKey.deleteMany({
      where: { userId: session.user.id, provider },
    });

    revalidatePath("/account");
    return { success: true, message: `API key ${provider} deleted successfully.` };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to delete API key." };
  }
}

export async function toggleApiKeyAction(
  provider: string,
  is_active: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    await prisma.userApiKey.updateMany({
      where: { userId: session.user.id, provider },
      data: { is_active },
    });

    revalidatePath("/account");
    return {
      success: true,
      message: is_active ? "API key activated successfully." : "API key deactivated successfully.",
    };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to toggle API key active." };
  }
}

export async function deleteAccountAction(
  confirmPassword?: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password_hash: true },
    });

    // Jika punya password, verifikasi dulu
    if (user?.password_hash && confirmPassword) {
      const valid = await compare(confirmPassword, user.password_hash);
      if (!valid) {
        return { success: false, error: "Password is incorrect." };
      }
    }

    // Soft delete: tandai tidak aktif + anonymize
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        is_active: false,
        name: "Deleted User",
        email: `deleted_${session.user.id}@deleted.invalid`,
        phone: null,
        avatar: null,
        password_hash: null,
      },
    });

    return { success: true, message: "Account deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to delete account." };
  }
}
