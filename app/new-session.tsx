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

import { AppScreen, HeroCard, PrimaryButton } from "../components/design-system";
import { PacingConfig, PrimaryDrinkType, SessionPresetName, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";
import { getPacingSummary } from "../utils/pacing";
import { primaryDrinkTypes, sessionPresets } from "../utils/session-presets";
import {
  formatEstimatedEndTime,
  getPlannedSessionDuration,
} from "../utils/session-timing";

type FormErrors = {
  firstIntervalMinutes?: string;
  laterIntervalMinutes?: string;
  maxDrinks?: string;
  spendingCap?: string;
};

export default function NewSessionScreen() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const { startSession } = useSession();
  const { isRestoringSettings, settings } = useSettings();
  const [selectedPresetName, setSelectedPresetName] = useState<SessionPresetName | null>(null);
  const [hasAppliedDefaultPreset, setHasAppliedDefaultPreset] = useState(false);
  const [pacingType, setPacingType] = useState<"fixed" | "dynamic">("fixed");
  const [firstIntervalMinutes, setFirstIntervalMinutes] = useState("60");
  const [laterIntervalMinutes, setLaterIntervalMinutes] = useState("90");
  const [switchAfterDrink, setSwitchAfterDrink] = useState(3);
  const [maxDrinks, setMaxDrinks] = useState("6");
  const [spendingCap, setSpendingCap] = useState("");
  const [primaryDrinkType, setPrimaryDrinkType] = useState<PrimaryDrinkType>("Beer");
  const [guidance, setGuidance] = useState<string | null>(null);
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const [foodReminderEnabled, setFoodReminderEnabled] = useState(false);
  const [goHomeReminderEnabled, setGoHomeReminderEnabled] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedPreset = sessionPresets.find((preset) => preset.name === selectedPresetName);
  const planningPacing = getPlanningPacing(
    pacingType,
    firstIntervalMinutes,
    laterIntervalMinutes,
    switchAfterDrink,
  );
  const parsedMaxDrinks = Number(maxDrinks);
  const estimatedEnd =
    planningPacing && Number.isFinite(parsedMaxDrinks) && parsedMaxDrinks > 0
      ? Date.now() + getPlannedSessionDuration(planningPacing, parsedMaxDrinks) * 60 * 1000
      : null;

  const handlePresetSelect = (presetName: SessionPresetName) => {
    const preset = sessionPresets.find((candidate) => candidate.name === presetName);

    if (!preset) {
      return;
    }

    setSelectedPresetName(preset.name);
    setMaxDrinks(String(preset.maxDrinks));
    setSpendingCap(preset.spendingCap === null ? "" : String(preset.spendingCap));
    setGuidance(preset.guidance);
    setPresetNote(preset.note ?? null);
    setFoodReminderEnabled(preset.behavioralReminders.food);
    setGoHomeReminderEnabled(preset.behavioralReminders.goHome);
    setPacingType(preset.pacing.type);

    if (preset.pacing.type === "fixed") {
      setFirstIntervalMinutes(String(preset.pacing.intervalMinutes));
    } else {
      setFirstIntervalMinutes(String(preset.pacing.firstIntervalMinutes));
      setLaterIntervalMinutes(String(preset.pacing.laterIntervalMinutes));
      setSwitchAfterDrink(preset.pacing.switchAfterDrink);
    }
  };

  useEffect(() => {
    if (
      !isRestoringSettings &&
      (preset || settings.defaultPreset) &&
      !selectedPresetName &&
      !hasAppliedDefaultPreset
    ) {
      handlePresetSelect((preset || settings.defaultPreset) as SessionPresetName);
      setHasAppliedDefaultPreset(true);
    }
  }, [
    hasAppliedDefaultPreset,
    isRestoringSettings,
    preset,
    selectedPresetName,
    settings.defaultPreset,
  ]);

  const handleStartSession = () => {
    const nextErrors: FormErrors = {};
    const parsedFirstInterval = Number(firstIntervalMinutes);
    const parsedLaterInterval = Number(laterIntervalMinutes);
    const parsedMaxDrinks = Number(maxDrinks);
    const trimmedSpendingCap = spendingCap.trim();
    const parsedSpendingCap = trimmedSpendingCap ? Number(trimmedSpendingCap) : null;

    if (!Number.isFinite(parsedFirstInterval) || parsedFirstInterval <= 0) {
      nextErrors.firstIntervalMinutes = "Use a number greater than 0.";
    }

    if (
      pacingType === "dynamic" &&
      (!Number.isFinite(parsedLaterInterval) || parsedLaterInterval <= 0)
    ) {
      nextErrors.laterIntervalMinutes = "Use a number greater than 0.";
    }

    if (!Number.isFinite(parsedMaxDrinks) || parsedMaxDrinks <= 0) {
      nextErrors.maxDrinks = "Use a number greater than 0.";
    }

    if (
      parsedSpendingCap !== null &&
      (!Number.isFinite(parsedSpendingCap) || parsedSpendingCap <= 0)
    ) {
      nextErrors.spendingCap = "Leave this blank or use a positive amount.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
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
            switchAfterDrink,
            type: "dynamic",
          };

    startSession({
      behavioralReminders: {
        foodEnabled: foodReminderEnabled,
        foodTriggered: false,
        goHomeEnabled: goHomeReminderEnabled,
        goHomeTriggered: false,
      },
      intervalMinutes: parsedFirstInterval,
      maxDrinks: Math.floor(parsedMaxDrinks),
      pacing,
      presetName: selectedPresetName,
      primaryDrinkType,
      spendingCap: parsedSpendingCap,
    });
    router.replace("/active-session");
  };

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.wine },
          headerStyle: { backgroundColor: colors.wine },
          headerTintColor: colors.card,
          headerTitleStyle: {
            color: colors.card,
            fontFamily: fontFamilies.cardTitle,
          },
          title: "New Session",
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <AppScreen>
          <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.kicker}>Plan builder</Text>
              <Text style={styles.title}>Set the plan while sober.</Text>
              <Text style={styles.subtitle}>
                Pick a starting point, then adjust anything that needs it.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Presets</Text>
              {sessionPresets.map((preset) => {
                const isSelected = selectedPresetName === preset.name;

                return (
                  <Pressable
                    key={preset.name}
                    onPress={() => handlePresetSelect(preset.name)}
                    style={[styles.presetCard, isSelected ? styles.presetCardSelected : null]}
                  >
                    <View style={styles.presetHeader}>
                      <Text
                        style={[styles.presetName, isSelected ? styles.presetNameSelected : null]}
                      >
                        {preset.name}
                      </Text>
                      {isSelected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
                    </View>
                    <Text style={[styles.cardBody, isSelected ? styles.selectedBody : null]}>
                      {preset.useCase}
                    </Text>
                    <Text
                      style={[styles.presetDetail, isSelected ? styles.presetDetailSelected : null]}
                    >
                      {getPacingSummary(preset.pacing)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {guidance ? (
              <HeroCard style={styles.guidanceCard}>
                <Text style={styles.guidanceTitle}>{selectedPreset?.name ?? "Guidance"}</Text>
                <Text style={styles.guidanceText}>{guidance}</Text>
                {presetNote ? <Text style={styles.guidanceText}>{presetNote}</Text> : null}
              </HeroCard>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.formTitle}>Plan details</Text>
              <Field
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

              <Field
                error={errors.firstIntervalMinutes}
                keyboardType="number-pad"
                label={pacingType === "fixed" ? "Drink interval in minutes" : "First 3 drinks"}
                onChangeText={setFirstIntervalMinutes}
                value={firstIntervalMinutes}
              />

              {pacingType === "dynamic" ? (
                <>
                  <View style={styles.summaryCard}>
                    <Text style={styles.label}>Switch point</Text>
                    <Text style={styles.cardBody}>After drink {switchAfterDrink}</Text>
                  </View>
                  <Field
                    error={errors.laterIntervalMinutes}
                    keyboardType="number-pad"
                    label="After that"
                    onChangeText={setLaterIntervalMinutes}
                    value={laterIntervalMinutes}
                  />
                </>
              ) : null}

              <Field
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

              {primaryDrinkType === "Spirits / liquor" || primaryDrinkType === "Cocktails" ? (
                <View style={styles.warningCard}>
                  <Text style={styles.warningText}>
                    Stronger drinks make it easier to cross the line without noticing. Consider a
                    lower max or longer interval.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.formTitle}>Pacing preview</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Current pacing rule</Text>
                <Text style={styles.cardBody}>
                  {getPacingSummary(
                    planningPacing ??
                      (pacingType === "fixed"
                        ? {
                            intervalMinutes: 0,
                            type: "fixed",
                          }
                        : {
                            firstIntervalMinutes: 0,
                            laterIntervalMinutes: 0,
                            switchAfterDrink,
                            type: "dynamic",
                          }),
                  )}
                </Text>
                {estimatedEnd ? (
                  <Text style={styles.estimateText}>{formatEstimatedEndTime(estimatedEnd)}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Behavioral reminders</Text>
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
              </View>
            </View>

            <PrimaryButton onPress={handleStartSession}>Start Session</PrimaryButton>
          </ScrollView>
        </AppScreen>
      </KeyboardAvoidingView>
    </>
  );
}

function getPlanningPacing(
  pacingType: "fixed" | "dynamic",
  firstIntervalMinutes: string,
  laterIntervalMinutes: string,
  switchAfterDrink: number,
): PacingConfig | null {
  const parsedFirstInterval = Number(firstIntervalMinutes);
  const parsedLaterInterval = Number(laterIntervalMinutes);

  if (!Number.isFinite(parsedFirstInterval) || parsedFirstInterval <= 0) {
    return null;
  }

  if (pacingType === "fixed") {
    return {
      intervalMinutes: parsedFirstInterval,
      type: "fixed",
    };
  }

  if (!Number.isFinite(parsedLaterInterval) || parsedLaterInterval <= 0) {
    return null;
  }

  return {
    firstIntervalMinutes: parsedFirstInterval,
    laterIntervalMinutes: parsedLaterInterval,
    switchAfterDrink,
    type: "dynamic",
  };
}

type FieldProps = {
  error?: string;
  keyboardType: "decimal-pad" | "number-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

function Field({ error, keyboardType, label, onChangeText, placeholder, value }: FieldProps) {
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
  subtitle: {
    color: colors.cardMuted,
    ...typography.body,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.card,
    ...typography.sectionTitle,
  },
  presetCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  presetCardSelected: {
    backgroundColor: colors.wine,
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  presetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  presetName: {
    flex: 1,
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 17,
    lineHeight: 23,
    minWidth: 0,
  },
  presetNameSelected: {
    color: colors.card,
  },
  selectedBadge: {
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    color: colors.white,
    fontFamily: fontFamilies.button,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  presetDetail: {
    color: colors.accentDark,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  presetDetailSelected: {
    color: colors.accentLight,
  },
  selectedBody: {
    color: colors.cardMuted,
  },
  guidanceCard: {
    borderColor: colors.accent,
  },
  guidanceTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  guidanceText: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
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
  warningCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  warningText: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
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
  estimateText: {
    color: colors.accentDark,
    fontFamily: fontFamilies.button,
    fontSize: 14,
    lineHeight: 20,
  },
});
