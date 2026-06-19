import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppScreen, PrimaryButton } from "../components/design-system";
import { usePresets } from "../context/presets";
import { PacingConfig, PrimaryDrinkType } from "../context/session";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";
import { getPacingSummary } from "../utils/pacing";
import {
  builtInPresetDefaults,
  isBuiltInPresetId,
  primaryDrinkTypes,
  SessionPreset,
} from "../utils/session-presets";

type EditorMode = "create-custom" | "edit-built-in" | "edit-custom";

type FormErrors = {
  firstIntervalMinutes?: string;
  laterIntervalMinutes?: string;
  maxDrinks?: string;
  name?: string;
  spendingCap?: string;
  switchAfterDrink?: string;
};

export default function PresetEditorScreen() {
  const { mode, presetId } = useLocalSearchParams<{ mode?: string; presetId?: string }>();
  const editorMode = getEditorMode(mode);
  const {
    builtInPresets,
    customPresets,
    isRestoringPresets,
    saveBuiltInPreset,
    saveCustomPreset,
  } = usePresets();
  const [hasLoadedPreset, setHasLoadedPreset] = useState(false);
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [guidance, setGuidance] = useState("");
  const [note, setNote] = useState("");
  const [pacingType, setPacingType] = useState<"fixed" | "dynamic">("fixed");
  const [firstIntervalMinutes, setFirstIntervalMinutes] = useState("60");
  const [laterIntervalMinutes, setLaterIntervalMinutes] = useState("90");
  const [switchAfterDrink, setSwitchAfterDrink] = useState("3");
  const [maxDrinks, setMaxDrinks] = useState("6");
  const [spendingCap, setSpendingCap] = useState("");
  const [primaryDrinkType, setPrimaryDrinkType] = useState<PrimaryDrinkType>("Beer");
  const [foodReminderEnabled, setFoodReminderEnabled] = useState(false);
  const [goHomeReminderEnabled, setGoHomeReminderEnabled] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  const sourcePreset = getSourcePreset(editorMode, presetId, builtInPresets, customPresets);
  const title = editorMode === "create-custom" ? "Create Preset" : "Edit Preset";

  useEffect(() => {
    if (hasLoadedPreset || isRestoringPresets) {
      return;
    }

    const initialPreset = sourcePreset ?? createCustomPresetTemplate();

    setEditingPresetId(initialPreset.id);
    setName(initialPreset.name);
    setUseCase(initialPreset.useCase);
    setGuidance(initialPreset.guidance);
    setNote(initialPreset.note ?? "");
    setMaxDrinks(String(initialPreset.maxDrinks));
    setSpendingCap(initialPreset.spendingCap === null ? "" : String(initialPreset.spendingCap));
    setPrimaryDrinkType(initialPreset.primaryDrinkType);
    setFoodReminderEnabled(initialPreset.behavioralReminders.food);
    setGoHomeReminderEnabled(initialPreset.behavioralReminders.goHome);
    setPacingType(initialPreset.pacing.type);

    if (initialPreset.pacing.type === "fixed") {
      setFirstIntervalMinutes(String(initialPreset.pacing.intervalMinutes));
      setLaterIntervalMinutes("90");
      setSwitchAfterDrink("3");
    } else {
      setFirstIntervalMinutes(String(initialPreset.pacing.firstIntervalMinutes));
      setLaterIntervalMinutes(String(initialPreset.pacing.laterIntervalMinutes));
      setSwitchAfterDrink(String(initialPreset.pacing.switchAfterDrink));
    }

    setHasLoadedPreset(true);
  }, [hasLoadedPreset, isRestoringPresets, sourcePreset]);

  const planningPacing = getPlanningPacing(
    pacingType,
    firstIntervalMinutes,
    laterIntervalMinutes,
    switchAfterDrink,
  );

  const handleSave = () => {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const parsedFirstInterval = Number(firstIntervalMinutes);
    const parsedLaterInterval = Number(laterIntervalMinutes);
    const parsedSwitchAfterDrink = Number(switchAfterDrink);
    const parsedMaxDrinks = Number(maxDrinks);
    const trimmedSpendingCap = spendingCap.trim();
    const parsedSpendingCap = trimmedSpendingCap ? Number(trimmedSpendingCap) : null;

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    }

    if (!Number.isFinite(parsedMaxDrinks) || parsedMaxDrinks <= 0) {
      nextErrors.maxDrinks = "Use a number greater than 0.";
    }

    if (!Number.isFinite(parsedFirstInterval) || parsedFirstInterval <= 0) {
      nextErrors.firstIntervalMinutes = "Use a number greater than 0.";
    }

    if (
      pacingType === "dynamic" &&
      (!Number.isFinite(parsedLaterInterval) || parsedLaterInterval <= 0)
    ) {
      nextErrors.laterIntervalMinutes = "Use a number greater than 0.";
    }

    if (
      pacingType === "dynamic" &&
      (!Number.isInteger(parsedSwitchAfterDrink) || parsedSwitchAfterDrink <= 0)
    ) {
      nextErrors.switchAfterDrink = "Use a whole number greater than 0.";
    }

    if (
      parsedSpendingCap !== null &&
      (!Number.isFinite(parsedSpendingCap) || parsedSpendingCap <= 0)
    ) {
      nextErrors.spendingCap = "Leave this blank or use a positive amount.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !editingPresetId) {
      return;
    }

    const pacing: PacingConfig =
      pacingType === "fixed"
        ? {
            intervalMinutes: parsedFirstInterval,
            type: "fixed",
          }
        : {
            firstIntervalMinutes: parsedFirstInterval,
            laterIntervalMinutes: parsedLaterInterval,
            switchAfterDrink: parsedSwitchAfterDrink,
            type: "dynamic",
          };
    const savedPreset: SessionPreset = {
      id: editingPresetId,
      name: trimmedName,
      useCase: useCase.trim() || "A custom starting point.",
      behavioralReminders: {
        food: foodReminderEnabled,
        goHome: goHomeReminderEnabled,
      },
      maxDrinks: Math.floor(parsedMaxDrinks),
      spendingCap: parsedSpendingCap,
      pacing,
      primaryDrinkType,
      guidance: guidance.trim() || "Use the plan you set while sober.",
      note: note.trim() || undefined,
    };

    if (editorMode === "edit-built-in" && isBuiltInPresetId(savedPreset.id)) {
      saveBuiltInPreset(savedPreset);
    } else {
      saveCustomPreset(savedPreset);
    }

    router.back();
  };

  const missingPreset =
    !isRestoringPresets && editorMode !== "create-custom" && hasLoadedPreset && !sourcePreset;

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.wine },
          headerStyle: { backgroundColor: colors.wine },
          headerTintColor: colors.card,
          headerTitleStyle: { color: colors.card, fontFamily: fontFamilies.cardTitle },
          title,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <AppScreen>
          <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.kicker}>Preset editor</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>
                Saved changes apply to future sessions only.
              </Text>
            </View>

            {isRestoringPresets ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Loading saved presets.</Text>
              </View>
            ) : null}

            {missingPreset ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>That preset is no longer available.</Text>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.formTitle}>Basics</Text>
              <Field
                error={errors.name}
                label="Name"
                onChangeText={setName}
                value={name}
              />
              <Field label="Description" onChangeText={setUseCase} value={useCase} />
              <Field label="Guidance" multiline onChangeText={setGuidance} value={guidance} />
              <Field label="Note" multiline onChangeText={setNote} placeholder="Optional" value={note} />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.formTitle}>Plan details</Text>
              <NumberField
                error={errors.maxDrinks}
                keyboardType="number-pad"
                label="Maximum drinks"
                onChangeText={setMaxDrinks}
                value={maxDrinks}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Pacing type</Text>
                <View style={styles.optionRow}>
                  <OptionButton
                    isSelected={pacingType === "fixed"}
                    label="Fixed interval"
                    onPress={() => setPacingType("fixed")}
                  />
                  <OptionButton
                    isSelected={pacingType === "dynamic"}
                    label="Dynamic interval"
                    onPress={() => setPacingType("dynamic")}
                  />
                </View>
              </View>

              <NumberField
                error={errors.firstIntervalMinutes}
                keyboardType="number-pad"
                label={pacingType === "fixed" ? "Drink interval in minutes" : "First drinks"}
                onChangeText={setFirstIntervalMinutes}
                value={firstIntervalMinutes}
              />

              {pacingType === "dynamic" ? (
                <>
                  <NumberField
                    error={errors.switchAfterDrink}
                    keyboardType="number-pad"
                    label="Switch after drink"
                    onChangeText={setSwitchAfterDrink}
                    value={switchAfterDrink}
                  />
                  <NumberField
                    error={errors.laterIntervalMinutes}
                    keyboardType="number-pad"
                    label="Later interval in minutes"
                    onChangeText={setLaterIntervalMinutes}
                    value={laterIntervalMinutes}
                  />
                </>
              ) : null}

              <NumberField
                error={errors.spendingCap}
                keyboardType="decimal-pad"
                label="Spending cap"
                onChangeText={setSpendingCap}
                placeholder="Optional"
                value={spendingCap}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Primary drink type</Text>
                <View style={styles.optionGrid}>
                  {primaryDrinkTypes.map((drinkType) => (
                    <OptionButton
                      key={drinkType}
                      isSelected={primaryDrinkType === drinkType}
                      label={drinkType}
                      onPress={() => setPrimaryDrinkType(drinkType)}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.formTitle}>Reminders</Text>
              <View style={styles.optionGrid}>
                <OptionButton
                  isSelected={foodReminderEnabled}
                  label={`Food reminder: ${foodReminderEnabled ? "on" : "off"}`}
                  onPress={() => setFoodReminderEnabled((enabled) => !enabled)}
                />
                <OptionButton
                  isSelected={goHomeReminderEnabled}
                  label={`Go-home reminder: ${goHomeReminderEnabled ? "on" : "off"}`}
                  onPress={() => setGoHomeReminderEnabled((enabled) => !enabled)}
                />
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Pacing summary</Text>
                <Text style={styles.cardBody}>
                  {planningPacing ? getPacingSummary(planningPacing) : "Complete interval values."}
                </Text>
              </View>
            </View>

            <View style={styles.footerActions}>
              <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <PrimaryButton disabled={missingPreset} onPress={handleSave}>
                Save preset
              </PrimaryButton>
            </View>
          </ScrollView>
        </AppScreen>
      </KeyboardAvoidingView>
    </>
  );
}

function getEditorMode(value: string | undefined): EditorMode {
  if (value === "edit-built-in" || value === "edit-custom") {
    return value;
  }

  return "create-custom";
}

function getSourcePreset(
  mode: EditorMode,
  presetId: string | undefined,
  builtInPresets: SessionPreset[],
  customPresets: SessionPreset[],
) {
  if (mode === "edit-built-in") {
    return builtInPresets.find((preset) => preset.id === presetId) ?? null;
  }

  if (mode === "edit-custom") {
    return customPresets.find((preset) => preset.id === presetId) ?? null;
  }

  return null;
}

function createCustomPresetTemplate(): SessionPreset {
  return {
    ...builtInPresetDefaults.soloHome,
    id: `customPreset-${Date.now()}`,
    name: "Custom preset",
    useCase: "A personalized starting point.",
  };
}

function getPlanningPacing(
  pacingType: "fixed" | "dynamic",
  firstIntervalMinutes: string,
  laterIntervalMinutes: string,
  switchAfterDrink: string,
): PacingConfig | null {
  const parsedFirstInterval = Number(firstIntervalMinutes);
  const parsedLaterInterval = Number(laterIntervalMinutes);
  const parsedSwitchAfterDrink = Number(switchAfterDrink);

  if (!Number.isFinite(parsedFirstInterval) || parsedFirstInterval <= 0) {
    return null;
  }

  if (pacingType === "fixed") {
    return {
      intervalMinutes: parsedFirstInterval,
      type: "fixed",
    };
  }

  if (
    !Number.isFinite(parsedLaterInterval) ||
    parsedLaterInterval <= 0 ||
    !Number.isInteger(parsedSwitchAfterDrink) ||
    parsedSwitchAfterDrink <= 0
  ) {
    return null;
  }

  return {
    firstIntervalMinutes: parsedFirstInterval,
    laterIntervalMinutes: parsedLaterInterval,
    switchAfterDrink: parsedSwitchAfterDrink,
    type: "dynamic",
  };
}

type FieldProps = {
  error?: string;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

function Field({ error, label, multiline = false, onChangeText, placeholder, value }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        style={[styles.input, multiline ? styles.multilineInput : null, error ? styles.inputError : null]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type NumberFieldProps = FieldProps & {
  keyboardType: "decimal-pad" | "number-pad";
};

function NumberField({
  error,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: NumberFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type OptionButtonProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

function OptionButton({ isSelected, label, onPress }: OptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
    >
      <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.wine,
  },
  screen: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.accentLight,
    textTransform: "uppercase",
    ...typography.caption,
  },
  title: {
    color: colors.card,
    ...typography.screenTitle,
  },
  body: {
    color: colors.cardMuted,
    ...typography.body,
  },
  sectionCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    ...shadows.card,
  },
  formTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    lineHeight: 21,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 18,
    lineHeight: 24,
  },
  multilineInput: {
    minHeight: 96,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  error: {
    color: colors.destructive,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionButton: {
    borderRadius: radius.pill,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.wine,
  },
  optionButtonText: {
    color: colors.ink,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  optionButtonTextSelected: {
    color: colors.accentLight,
  },
  summaryCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cardBody: {
    color: colors.muted,
    ...typography.body,
  },
  footerActions: {
    gap: spacing.md,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.button,
    fontSize: 16,
    lineHeight: 22,
  },
  notice: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
  },
  noticeText: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
});
