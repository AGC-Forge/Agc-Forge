"use server";

import { prisma } from "@/lib/prisma";
import type { Setting } from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { buildSettingMap, getSetting, DEFAULTS_SETTINGS } from "@/utils/settings";
import { parseBool } from "@/utils/formatter";

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
