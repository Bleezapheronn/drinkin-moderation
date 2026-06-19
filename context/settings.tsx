import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { normalizePresetReference } from "../utils/session-presets";

export type DefaultPresetSetting = string | null;

export type CurrencyCode = "KES" | "USD";
export type WaterReminderPreference = "in-app" | "off";
export type ReminderSoundChoice = "system" | "silent" | "built-in" | "device-file";

export type SelectedAudioFile = {
  mimeType: string | null;
  name: string;
  size: number | null;
  uri: string;
};

export type ReminderSoundSetting = {
  choice: ReminderSoundChoice;
  deviceFile: SelectedAudioFile | null;
};

export type AppSettings = {
  currency: CurrencyCode;
  defaultPreset: DefaultPresetSetting;
  goHomeReminderSound: ReminderSoundSetting;
  goHomeReminderVibrate: boolean;
  goHomePhoneNotifications: boolean;
  intervalReminderSound: ReminderSoundSetting;
  intervalReminderVibrate: boolean;
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
  goHomeReminderSound: {
    choice: "system",
    deviceFile: null,
  },
  goHomeReminderVibrate: true,
  goHomePhoneNotifications: true,
  intervalReminderSound: {
    choice: "system",
    deviceFile: null,
  },
  intervalReminderVibrate: true,
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
    defaultPreset: parseDefaultPreset(parsedSettings.defaultPreset),
    goHomeReminderSound: parseReminderSoundSetting(parsedSettings.goHomeReminderSound),
    goHomeReminderVibrate: parseReminderVibrateSetting(
      parsedSettings.goHomeReminderVibrate,
      parsedSettings.goHomeReminderSound,
    ),
    goHomePhoneNotifications: parsedSettings.goHomePhoneNotifications ?? true,
    intervalReminderSound: parseReminderSoundSetting(parsedSettings.intervalReminderSound),
    intervalReminderVibrate: parseReminderVibrateSetting(
      parsedSettings.intervalReminderVibrate,
      parsedSettings.intervalReminderSound,
    ),
    nextDrinkPhoneNotifications: parsedSettings.nextDrinkPhoneNotifications ?? true,
    onboardingCompleted: parsedSettings.onboardingCompleted ?? false,
    waterReminder: parsedSettings.waterReminder === "off" ? "off" : "in-app",
  };
}

function parseReminderSoundSetting(value: unknown): ReminderSoundSetting {
  if (!value || typeof value !== "object") {
    return { choice: "system", deviceFile: null };
  }

  const soundSetting = value as Partial<ReminderSoundSetting>;

  return {
    choice: isReminderSoundChoice(soundSetting.choice) ? soundSetting.choice : "system",
    deviceFile: parseSelectedAudioFile(soundSetting.deviceFile),
  };
}

function parseReminderVibrateSetting(value: unknown, soundValue: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    soundValue &&
    typeof soundValue === "object" &&
    (soundValue as Partial<ReminderSoundSetting>).choice === "silent"
  ) {
    return true;
  }

  return true;
}

function parseSelectedAudioFile(value: unknown): SelectedAudioFile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const audioFile = value as Partial<SelectedAudioFile>;

  if (typeof audioFile.name !== "string" || typeof audioFile.uri !== "string") {
    return null;
  }

  return {
    mimeType: typeof audioFile.mimeType === "string" ? audioFile.mimeType : null,
    name: audioFile.name,
    size: typeof audioFile.size === "number" ? audioFile.size : null,
    uri: audioFile.uri,
  };
}

function isReminderSoundChoice(value: unknown): value is ReminderSoundChoice {
  return value === "system" || value === "silent" || value === "built-in" || value === "device-file";
}

function parseDefaultPreset(value: unknown): DefaultPresetSetting {
  return normalizePresetReference(value);
}

export function useSettings() {
  const value = useContext(SettingsContext);

  if (!value) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return value;
}
