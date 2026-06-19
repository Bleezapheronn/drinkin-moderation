import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSettings } from "./settings";
import {
  BuiltInPresetId,
  builtInPresetDefaults,
  defaultPresetStorage,
  findPresetByReference,
  getBuiltInPresetOverride,
  getMergedBuiltInPresets,
  isBuiltInPresetId,
  isEmptyPresetOverride,
  parsePresetStorage,
  PresetStorage,
  SessionPreset,
  SessionPresetOverride,
} from "../utils/session-presets";

type PresetsContextValue = {
  allPresets: SessionPreset[];
  builtInPresets: SessionPreset[];
  customPresets: SessionPreset[];
  getPresetByReference: (reference: string | null | undefined) => SessionPreset | null;
  hasBuiltInOverride: (presetId: string) => boolean;
  isRestoringPresets: boolean;
  presetsError: string | null;
  resetBuiltInPreset: (presetId: BuiltInPresetId) => void;
  saveBuiltInPreset: (preset: SessionPreset) => void;
  saveCustomPreset: (preset: SessionPreset) => void;
  deleteCustomPreset: (presetId: string) => void;
};

const PresetsContext = createContext<PresetsContextValue | null>(null);
const presetsKey = "dim.sessionPresets";

export function PresetsProvider({ children }: PropsWithChildren) {
  const { settings, updateSettings } = useSettings();
  const [presetStorage, setPresetStorage] = useState<PresetStorage>(defaultPresetStorage);
  const [isRestoringPresets, setIsRestoringPresets] = useState(true);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  useEffect(() => {
    async function restorePresets() {
      try {
        const storedPresets = await AsyncStorage.getItem(presetsKey);

        setPresetStorage(storedPresets ? parsePresetStorage(storedPresets) : defaultPresetStorage);
      } catch {
        setPresetsError("Saved presets could not be loaded. Built-in presets are still available.");
      } finally {
        setIsRestoringPresets(false);
      }
    }

    void restorePresets();
  }, []);

  const builtInPresets = useMemo(
    () => getMergedBuiltInPresets(presetStorage.builtInOverrides),
    [presetStorage.builtInOverrides],
  );
  const allPresets = useMemo(
    () => [...builtInPresets, ...presetStorage.customPresets],
    [builtInPresets, presetStorage.customPresets],
  );

  useEffect(() => {
    if (
      isRestoringPresets ||
      !settings.defaultPreset ||
      isBuiltInPresetId(settings.defaultPreset) ||
      allPresets.some((preset) => preset.id === settings.defaultPreset)
    ) {
      return;
    }

    updateSettings({ defaultPreset: null });
  }, [allPresets, isRestoringPresets, settings.defaultPreset, updateSettings]);

  const persistPresetStorage = useCallback((nextStorage: PresetStorage) => {
    AsyncStorage.setItem(presetsKey, JSON.stringify(nextStorage)).catch(() => {
      setPresetsError("Preset changes could not be saved on this device.");
    });
  }, []);

  const updatePresetStorage = useCallback(
    (updater: (currentStorage: PresetStorage) => PresetStorage) => {
      setPresetStorage((currentStorage) => {
        const nextStorage = updater(currentStorage);

        persistPresetStorage(nextStorage);
        return nextStorage;
      });
    },
    [persistPresetStorage],
  );

  const value = useMemo<PresetsContextValue>(
    () => ({
      allPresets,
      builtInPresets,
      customPresets: presetStorage.customPresets,
      getPresetByReference: (reference) => findPresetByReference(allPresets, reference),
      hasBuiltInOverride: (presetId) => Boolean(presetStorage.builtInOverrides[presetId]),
      isRestoringPresets,
      presetsError,
      resetBuiltInPreset: (presetId) => {
        updatePresetStorage((currentStorage) => {
          const { [presetId]: _removedOverride, ...remainingOverrides } =
            currentStorage.builtInOverrides;

          return {
            ...currentStorage,
            builtInOverrides: remainingOverrides,
          };
        });
      },
      saveBuiltInPreset: (preset) => {
        if (!isBuiltInPresetId(preset.id)) {
          return;
        }

        const override = getBuiltInPresetOverride(builtInPresetDefaults[preset.id], preset);

        updatePresetStorage((currentStorage) => {
          const nextOverrides: Record<string, SessionPresetOverride> = {
            ...currentStorage.builtInOverrides,
          };

          if (isEmptyPresetOverride(override)) {
            delete nextOverrides[preset.id];
          } else {
            nextOverrides[preset.id] = override;
          }

          return {
            ...currentStorage,
            builtInOverrides: nextOverrides,
          };
        });
      },
      saveCustomPreset: (preset) => {
        updatePresetStorage((currentStorage) => {
          const existingIndex = currentStorage.customPresets.findIndex(
            (customPreset) => customPreset.id === preset.id,
          );
          const nextCustomPresets =
            existingIndex >= 0
              ? currentStorage.customPresets.map((customPreset) =>
                  customPreset.id === preset.id ? preset : customPreset,
                )
              : [...currentStorage.customPresets, preset];

          return {
            ...currentStorage,
            customPresets: nextCustomPresets,
          };
        });
      },
      deleteCustomPreset: (presetId) => {
        updatePresetStorage((currentStorage) => ({
          ...currentStorage,
          customPresets: currentStorage.customPresets.filter((preset) => preset.id !== presetId),
        }));

        if (settings.defaultPreset === presetId) {
          updateSettings({ defaultPreset: null });
        }
      },
    }),
    [
      allPresets,
      builtInPresets,
      isRestoringPresets,
      presetStorage.builtInOverrides,
      presetStorage.customPresets,
      presetsError,
      settings.defaultPreset,
      updateSettings,
      updatePresetStorage,
    ],
  );

  return <PresetsContext.Provider value={value}>{children}</PresetsContext.Provider>;
}

export function usePresets() {
  const value = useContext(PresetsContext);

  if (!value) {
    throw new Error("usePresets must be used inside PresetsProvider");
  }

  return value;
}
