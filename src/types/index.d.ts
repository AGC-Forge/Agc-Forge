declare global {
  type Nullable<T> = T | null;

  type SettingRow = Pick<SettingConfig, 'key' | 'value'> & { updated_at?: Date };

  interface SettingConfig {
    site_name: string;
    site_description: string;
    site_keywords: string;
    site_icon: string;
    site_logo: string;
    site_favicon: string;
    site_theme: string;
    is_maintenance: boolean;
    enable_register: boolean;
    enable_github_provider: boolean;
    enable_google_provider: boolean;
  }
}

export { };
