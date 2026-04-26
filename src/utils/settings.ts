import { normalizeScalar } from "./formatter";

export const DEFAULTS_SETTINGS: SettingConfig = {
  site_name: "Agc Forge",
  site_description: "Agc Forge",
  site_keywords: "Agc Forge",
  site_icon: "/logo.png",
  site_logo: "/logo-small.png",
  site_favicon: "/favicon.ico",
  site_theme: "light",
  is_maintenance: false,
  enable_register: true,
  enable_github_provider: true,
  enable_google_provider: true,
}

export const buildSettingMap = (rows: SettingRow[]): Map<string, string> => {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.updated_at?.getTime() ?? 0;
    const tb = b.updated_at?.getTime() ?? 0;
    return ta - tb;
  });
  return new Map(sorted.map((r) => [r.key, r.value] as [string, string]));
};
export const getSetting = (m: Map<string, string>, key: string): string | undefined => {
  const defaultValue = (DEFAULTS_SETTINGS as unknown as Record<string, unknown>)[key];
  return normalizeScalar(m.get(key) ?? (defaultValue as string | undefined));
};
