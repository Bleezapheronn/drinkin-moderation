import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

export type DefaultPresetSetting =
  | null
  | "Solo / Home"
  | "Drinks @Home w/ Company"
  | "Night Out"
  | "High-Risk Night";

export type CurrencyCode = "KES" | "USD";
export type WaterReminderPreference = "in-app" | "off";

export type AppSettings = {
  currency: CurrencyCode;
  defaultPreset: DefaultPresetSetting;
  goHomePhoneNotifications: boolean;
  nextDrinkPhoneNotifications: boolean;
  onboardingCompleted: boolean;
  waterReminder: WaterReminderPreference;
};

type SettingsContextValue = {
  isRestoringSettings: boolean;
  settings: AppSettings;
  settingsError: string | null;
  updateSettings: (updates: Partial<AppSettings>) => void;
};

const defaultSettings: AppSettings = {
  currency: "KES",
  defaultPreset: null,
  goHomePhoneNotifications: true,
  nextDrinkPhoneNotifications: true,
  onboardingCompleted: false,
  waterReminder: "in-app",
};

const settingsKey = "dim.settings";
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isRestoringSettings, setIsRestoringSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSettings() {
      try {
        const storedSettings = await AsyncStorage.getItem(settingsKey);

        setSettings(storedSettings ? parseSettings(storedSettings) : defaultSettings);
      } catch {
        setSettingsError("Settings could not be loaded. Defaults are still available.");
      } finally {
        setIsRestoringSettings(false);
      }
    }

    void restoreSettings();
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      isRestoringSettings,
      settings,
      settingsError,
      updateSettings: (updates) => {
        setSettings((currentSettings) => {
          const nextSettings = {
            ...currentSettings,
            ...updates,
          };

          AsyncStorage.setItem(settingsKey, JSON.stringify(nextSettings)).catch(() => {
            setSettingsError("Settings could not be saved on this device.");
          });

          return nextSettings;
        });
      },
    }),
    [isRestoringSettings, settings, settingsError],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

function parseSettings(value: string): AppSettings {
  const parsedSettings = JSON.parse(value) as Partial<AppSettings>;

  return {
    ...defaultSettings,
    ...parsedSettings,
    currency: parsedSettings.currency === "USD" ? "USD" : "KES",
    defaultPreset: isDefaultPreset(parsedSettings.defaultPreset)
      ? parsedSettings.defaultPreset
      : null,
    goHomePhoneNotifications: parsedSettings.goHomePhoneNotifications ?? true,
    nextDrinkPhoneNotifications: parsedSettings.nextDrinkPhoneNotifications ?? true,
    onboardingCompleted: parsedSettings.onboardingCompleted ?? false,
    waterReminder: parsedSettings.waterReminder === "off" ? "off" : "in-app",
  };
}

function isDefaultPreset(value: unknown): value is DefaultPresetSetting {
  return (
    value === null ||
    value === "Solo / Home" ||
    value === "Drinks @Home w/ Company" ||
    value === "Night Out" ||
    value === "High-Risk Night"
  );
}

export function useSettings() {
  const value = useContext(SettingsContext);

  if (!value) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return value;
}
