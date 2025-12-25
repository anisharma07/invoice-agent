// Settings utility functions for managing app preferences

interface AppSettings {
  autoSaveEnabled: boolean;
  defaultCurrency: string;
}

const SETTINGS_KEY = "app_settings";

const defaultSettings: AppSettings = {
  autoSaveEnabled: false, // Default to disabled
  defaultCurrency: 'USD'
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    // Error loading settings, return defaults
  }
  return defaultSettings;
};

export const saveSettings = (settings: Partial<AppSettings>): void => {
  try {
    const currentSettings = getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    // Error saving settings
  }
};

export const getAutoSaveEnabled = (): boolean => {
  return getSettings().autoSaveEnabled;
};

export const setAutoSaveEnabled = (enabled: boolean): void => {
  saveSettings({ autoSaveEnabled: enabled });
};

export const getDefaultCurrency = (): string => {
  return getSettings().defaultCurrency;
};

export const setDefaultCurrency = (currency: string): void => {
  saveSettings({ defaultCurrency: currency });
};
