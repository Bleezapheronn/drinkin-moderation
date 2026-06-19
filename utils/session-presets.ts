import type { PacingConfig, PrimaryDrinkType } from "../context/session";

export type BuiltInPresetId =
  | "soloHome"
  | "drinksAtHomeWithCompany"
  | "nightOut"
  | "highRiskNight";

export type SessionPreset = {
  id: string;
  name: string;
  useCase: string;
  behavioralReminders: {
    food: boolean;
    goHome: boolean;
  };
  maxDrinks: number;
  spendingCap: number | null;
  pacing: PacingConfig;
  primaryDrinkType: PrimaryDrinkType;
  guidance: string;
  note?: string;
};

export type SessionPresetOverride = Partial<Omit<SessionPreset, "id">>;

export type PresetStorage = {
  builtInOverrides: Record<string, SessionPresetOverride>;
  customPresets: SessionPreset[];
};

export const primaryDrinkTypes: PrimaryDrinkType[] = [
  "Beer",
  "Wine",
  "Spirits / liquor",
  "Cocktails",
  "Mixed",
  "Non-alcoholic / tracking only",
];

export const builtInPresetIds: BuiltInPresetId[] = [
  "soloHome",
  "drinksAtHomeWithCompany",
  "nightOut",
  "highRiskNight",
];

export const builtInPresetDefaults: Record<BuiltInPresetId, SessionPreset> = {
  soloHome: {
    id: "soloHome",
    name: "Solo / Home",
    useCase: "A low-risk home session.",
    maxDrinks: 3,
    behavioralReminders: {
      food: false,
      goHome: false,
    },
    spendingCap: null,
    pacing: {
      intervalMinutes: 60,
      type: "fixed",
    },
    primaryDrinkType: "Beer",
    guidance: "Easy night. Keep it simple.",
  },
  drinksAtHomeWithCompany: {
    id: "drinksAtHomeWithCompany",
    name: "Hosting Company",
    useCase: "Friends are over and the night may run long.",
    maxDrinks: 6,
    behavioralReminders: {
      food: false,
      goHome: false,
    },
    spendingCap: null,
    pacing: {
      firstIntervalMinutes: 60,
      laterIntervalMinutes: 90,
      switchAfterDrink: 3,
      type: "dynamic",
    },
    primaryDrinkType: "Beer",
    guidance: "Good company can stretch the night. Let the app handle the pacing.",
  },
  nightOut: {
    id: "nightOut",
    name: "Night Out",
    useCase: "A social night where spending, food, and getting home matter.",
    maxDrinks: 6,
    behavioralReminders: {
      food: true,
      goHome: true,
    },
    spendingCap: 3000,
    pacing: {
      firstIntervalMinutes: 60,
      laterIntervalMinutes: 90,
      switchAfterDrink: 3,
      type: "dynamic",
    },
    primaryDrinkType: "Beer",
    guidance: "Pace the night. Eat halfway. Go home when the plan is done.",
    note: "Spending and food matter tonight. Set a cap, eat halfway, and go home when the plan is done.",
  },
  highRiskNight: {
    id: "highRiskNight",
    name: "High-Risk Night",
    useCase: "Hard liquor, volatile company, or outside your comfort zone.",
    maxDrinks: 3,
    behavioralReminders: {
      food: false,
      goHome: true,
    },
    spendingCap: 2000,
    pacing: {
      intervalMinutes: 90,
      type: "fixed",
    },
    primaryDrinkType: "Beer",
    guidance: "This is a guardrail night. Slow down and create an exit.",
    note: "This preset is for nights where you want stronger guardrails. The goal is to get home with no regrets.",
  },
};

export const sessionPresets = builtInPresetIds.map((id) => builtInPresetDefaults[id]);

const legacyPresetNameToId: Record<string, BuiltInPresetId> = {
  "Solo / Home": "soloHome",
  "Drinks @Home w/ Company": "drinksAtHomeWithCompany",
  "Hosting Company": "drinksAtHomeWithCompany",
  "Night Out": "nightOut",
  "High-Risk Night": "highRiskNight",
};

export const defaultPresetStorage: PresetStorage = {
  builtInOverrides: {},
  customPresets: [],
};

export function isBuiltInPresetId(value: string): value is BuiltInPresetId {
  return builtInPresetIds.includes(value as BuiltInPresetId);
}

export function normalizePresetReference(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return legacyPresetNameToId[trimmedValue] ?? trimmedValue;
}

export function findPresetByReference(
  presets: SessionPreset[],
  reference: string | null | undefined,
) {
  const presetId = normalizePresetReference(reference);

  if (!presetId) {
    return null;
  }

  return presets.find((preset) => preset.id === presetId || preset.name === reference) ?? null;
}

export function mergeBuiltInPreset(
  defaultPreset: SessionPreset,
  override: SessionPresetOverride | undefined,
): SessionPreset {
  if (!override) {
    return defaultPreset;
  }

  return {
    ...defaultPreset,
    ...override,
    id: defaultPreset.id,
    behavioralReminders: {
      ...defaultPreset.behavioralReminders,
      ...override.behavioralReminders,
    },
    pacing: override.pacing ?? defaultPreset.pacing,
  };
}

export function getMergedBuiltInPresets(overrides: Record<string, SessionPresetOverride>) {
  return builtInPresetIds.map((id) => mergeBuiltInPreset(builtInPresetDefaults[id], overrides[id]));
}

export function getBuiltInPresetOverride(
  defaultPreset: SessionPreset,
  editedPreset: SessionPreset,
): SessionPresetOverride {
  const override: SessionPresetOverride = {};

  if (editedPreset.name !== defaultPreset.name) {
    override.name = editedPreset.name;
  }

  if (editedPreset.useCase !== defaultPreset.useCase) {
    override.useCase = editedPreset.useCase;
  }

  if (editedPreset.maxDrinks !== defaultPreset.maxDrinks) {
    override.maxDrinks = editedPreset.maxDrinks;
  }

  if (editedPreset.spendingCap !== defaultPreset.spendingCap) {
    override.spendingCap = editedPreset.spendingCap;
  }

  if (editedPreset.primaryDrinkType !== defaultPreset.primaryDrinkType) {
    override.primaryDrinkType = editedPreset.primaryDrinkType;
  }

  if (editedPreset.guidance !== defaultPreset.guidance) {
    override.guidance = editedPreset.guidance;
  }

  if ((editedPreset.note ?? "") !== (defaultPreset.note ?? "")) {
    override.note = editedPreset.note;
  }

  if (
    editedPreset.behavioralReminders.food !== defaultPreset.behavioralReminders.food ||
    editedPreset.behavioralReminders.goHome !== defaultPreset.behavioralReminders.goHome
  ) {
    override.behavioralReminders = editedPreset.behavioralReminders;
  }

  if (JSON.stringify(editedPreset.pacing) !== JSON.stringify(defaultPreset.pacing)) {
    override.pacing = editedPreset.pacing;
  }

  return override;
}

export function isEmptyPresetOverride(override: SessionPresetOverride) {
  return Object.keys(override).length === 0;
}

export function parsePresetStorage(value: string): PresetStorage {
  const parsedStorage = JSON.parse(value) as Partial<PresetStorage>;

  return {
    builtInOverrides: parseBuiltInOverrides(parsedStorage.builtInOverrides),
    customPresets: Array.isArray(parsedStorage.customPresets)
      ? parsedStorage.customPresets.map(parseCustomPreset).filter(isSessionPreset)
      : [],
  };
}

function isSessionPreset(value: SessionPreset | null): value is SessionPreset {
  return value !== null;
}

function parseBuiltInOverrides(value: unknown): Record<string, SessionPresetOverride> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, SessionPresetOverride>>(
    (overrides, [id, overrideValue]) => {
      if (!isBuiltInPresetId(id) || !overrideValue || typeof overrideValue !== "object") {
        return overrides;
      }

      const override = parsePresetOverride(overrideValue);

      if (!isEmptyPresetOverride(override)) {
        overrides[id] = override;
      }

      return overrides;
    },
    {},
  );
}

function parsePresetOverride(value: unknown): SessionPresetOverride {
  const source = value as Partial<SessionPreset>;
  const override: SessionPresetOverride = {};

  if (typeof source.name === "string") {
    override.name = source.name;
  }

  if (typeof source.useCase === "string") {
    override.useCase = source.useCase;
  }

  if (typeof source.maxDrinks === "number" && Number.isFinite(source.maxDrinks)) {
    override.maxDrinks = source.maxDrinks;
  }

  if (
    source.spendingCap === null ||
    (typeof source.spendingCap === "number" && Number.isFinite(source.spendingCap))
  ) {
    override.spendingCap = source.spendingCap;
  }

  if (isPrimaryDrinkType(source.primaryDrinkType)) {
    override.primaryDrinkType = source.primaryDrinkType;
  }

  if (typeof source.guidance === "string") {
    override.guidance = source.guidance;
  }

  if (typeof source.note === "string") {
    override.note = source.note;
  }

  if (isBehavioralReminderConfig(source.behavioralReminders)) {
    override.behavioralReminders = source.behavioralReminders;
  }

  if (isPacingConfig(source.pacing)) {
    override.pacing = source.pacing;
  }

  return override;
}

function parseCustomPreset(value: unknown): SessionPreset | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<SessionPreset>;

  if (typeof source.id !== "string" || !source.id.trim()) {
    return null;
  }

  const fallbackPreset = builtInPresetDefaults.soloHome;

  return {
    ...fallbackPreset,
    id: source.id,
    name: typeof source.name === "string" && source.name.trim() ? source.name : "Custom preset",
    useCase: typeof source.useCase === "string" ? source.useCase : fallbackPreset.useCase,
    behavioralReminders: isBehavioralReminderConfig(source.behavioralReminders)
      ? source.behavioralReminders
      : fallbackPreset.behavioralReminders,
    maxDrinks:
      typeof source.maxDrinks === "number" && Number.isFinite(source.maxDrinks)
        ? source.maxDrinks
        : fallbackPreset.maxDrinks,
    spendingCap:
      source.spendingCap === null ||
      (typeof source.spendingCap === "number" && Number.isFinite(source.spendingCap))
        ? source.spendingCap
        : fallbackPreset.spendingCap,
    pacing: isPacingConfig(source.pacing) ? source.pacing : fallbackPreset.pacing,
    primaryDrinkType: isPrimaryDrinkType(source.primaryDrinkType)
      ? source.primaryDrinkType
      : fallbackPreset.primaryDrinkType,
    guidance: typeof source.guidance === "string" ? source.guidance : fallbackPreset.guidance,
    note: typeof source.note === "string" ? source.note : undefined,
  };
}

function isBehavioralReminderConfig(value: unknown): value is SessionPreset["behavioralReminders"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reminderConfig = value as Partial<SessionPreset["behavioralReminders"]>;

  return typeof reminderConfig.food === "boolean" && typeof reminderConfig.goHome === "boolean";
}

function isPacingConfig(value: unknown): value is PacingConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const pacing = value as Partial<PacingConfig>;

  if (pacing.type === "fixed") {
    return typeof pacing.intervalMinutes === "number" && Number.isFinite(pacing.intervalMinutes);
  }

  if (pacing.type === "dynamic") {
    return (
      typeof pacing.firstIntervalMinutes === "number" &&
      Number.isFinite(pacing.firstIntervalMinutes) &&
      typeof pacing.laterIntervalMinutes === "number" &&
      Number.isFinite(pacing.laterIntervalMinutes) &&
      typeof pacing.switchAfterDrink === "number" &&
      Number.isFinite(pacing.switchAfterDrink)
    );
  }

  return false;
}

function isPrimaryDrinkType(value: unknown): value is PrimaryDrinkType {
  return primaryDrinkTypes.includes(value as PrimaryDrinkType);
}
