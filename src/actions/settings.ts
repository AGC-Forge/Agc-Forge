"use server";


import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Setting } from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { buildSettingMap, getSetting, DEFAULTS_SETTINGS } from "@/utils/settings";
import { parseBool } from "@/utils/formatter";
import { appSettingsSchema, type AppSettingsInput } from "@/lib/validations/account";

export const getSettings = async (): Promise<SettingRow[]> => {
  try {
    return (await prisma.setting.findMany({ select: { key: true, value: true, updated_at: true } })) as SettingRow[];
  } catch (error) {
    console.error(`Failed to get app settings: ${error}`);
    return [];
  }
}
export const findByKey = async (key: string): Promise<Pick<Setting, 'key' | 'value'> | null> => {
  try {
    return await prisma.setting.findFirst({
      where: { key },
      orderBy: { updated_at: 'desc' },
      select: { key: true, value: true },
    });
  } catch (error) {
    console.error(`Failed to get app setting: ${error}`);
    return null;
  }
};
export const updateByKey = async (key: string, value: string): Promise<void> => {
  try {
    const res = await prisma.setting.updateMany({ where: { key }, data: { value } });
    if (res.count === 0) {
      await prisma.setting.create({ data: { key, value, group_name: 'default' } });
    }
  } catch (error) {
    console.error(`Failed to update setting: ${error}`);
    throw error;
  }
};
export const getSetupConfig = async (): Promise<SettingConfig> => {
  const rows = await getSettings();
  const m = buildSettingMap(rows);
  return {
    site_name: getSetting(m, 'site_name') ?? DEFAULTS_SETTINGS.site_name,
    site_description: getSetting(m, 'site_description') ?? DEFAULTS_SETTINGS.site_description,
    site_keywords: getSetting(m, 'site_keywords') ?? DEFAULTS_SETTINGS.site_keywords,
    site_icon: getSetting(m, 'site_icon') ?? DEFAULTS_SETTINGS.site_icon,
    site_logo: getSetting(m, 'site_logo') ?? DEFAULTS_SETTINGS.site_logo,
    site_favicon: getSetting(m, 'site_favicon') ?? DEFAULTS_SETTINGS.site_favicon,
    site_theme: getSetting(m, 'site_theme') ?? DEFAULTS_SETTINGS.site_theme,
    is_maintenance: parseBool(getSetting(m, 'is_maintenance'), DEFAULTS_SETTINGS.is_maintenance),
    enable_register: parseBool(getSetting(m, 'enable_register'), DEFAULTS_SETTINGS.enable_register),
    enable_github_provider: parseBool(getSetting(m, 'enable_github_provider'), DEFAULTS_SETTINGS.enable_github_provider),
    enable_google_provider: parseBool(getSetting(m, 'enable_google_provider'), DEFAULTS_SETTINGS.enable_google_provider),
  }
}
async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const roleLevel = (session.user as any).role_level ?? 0;
  if (roleLevel < 50) throw new Error("Access denied. Need role admin.");
  return session;
}
export async function getSettingsAction(): Promise<
  ActionResult<Record<string, string>>
> {
  try {
    await auth(); // hanya user yang login

    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return { success: true, data: map };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to get settings." };
  }
}
export async function updateAppSettingsAction(
  data: AppSettingsInput
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = appSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const settingsToUpdate = [
      { key: "site_name", value: parsed.data.site_name, group_name: "general" },
      {
        key: "site_description",
        value: parsed.data.site_description ?? "",
        group_name: "general",
      },
      {
        key: "is_maintenance",
        value: String(parsed.data.is_maintenance),
        group_name: "general",
      },
      {
        key: "enable_register",
        value: String(parsed.data.enable_register),
        group_name: "auth",
      },
      {
        key: "enable_github_provider",
        value: String(parsed.data.enable_github_provider),
        group_name: "auth",
      },
      {
        key: "enable_google_provider",
        value: String(parsed.data.enable_google_provider),
        group_name: "auth",
      },
      ...(parsed.data.default_provider
        ? [{ key: "default_provider", value: parsed.data.default_provider, group_name: "ai" }]
        : []),
      ...(parsed.data.default_model_id
        ? [{ key: "default_model_id", value: parsed.data.default_model_id, group_name: "ai" }]
        : []),
    ];

    await prisma.$transaction(
      settingsToUpdate.map((s) =>
        prisma.setting.upsert({
          where: { setting_key_group_name_unique: { key: s.key, group_name: s.group_name } },
          update: { value: s.value },
          create: s,
        })
      )
    );

    revalidatePath("/settings");
    return { success: true, message: "Settings saved successfully." };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Failed to save settings." };
  }
}
export async function getSettingAction(
  key: string,
  group_name = "general"
): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { setting_key_group_name_unique: { key, group_name } },
  });
  return setting?.value ?? null;
}
