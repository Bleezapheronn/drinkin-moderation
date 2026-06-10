import { router, useLocalSearchParams } from "expo-router";
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

import { PacingConfig, PrimaryDrinkType, SessionPresetName, useSession } from "../context/session";
import { useSettings } from "../context/settings";
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set the plan while clear-headed.</Text>
        <Text style={styles.body}>Pick a starting point, then adjust anything that needs it.</Text>

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
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.body}>{preset.useCase}</Text>
                <Text style={styles.presetDetail}>{getPacingSummary(preset.pacing)}</Text>
              </Pressable>
            );
          })}
        </View>

        {guidance ? (
          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceTitle}>{selectedPreset?.name ?? "Guidance"}</Text>
            <Text style={styles.guidanceText}>{guidance}</Text>
            {presetNote ? <Text style={styles.guidanceText}>{presetNote}</Text> : null}
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Plan details</Text>
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
                <Text style={styles.body}>After drink {switchAfterDrink}</Text>
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

          <View style={styles.summaryCard}>
            <Text style={styles.label}>Current pacing rule</Text>
            <Text style={styles.body}>
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
            <View style={styles.optionRow}>
              <OptionButton
                isSelected={foodReminderEnabled}
                label={`Food reminder: ${foodReminderEnabled ? "on" : "off"}`}
                onPress={() => setFoodReminderEnabled((enabled) => !enabled)}
              />
            </View>
            <View style={styles.optionRow}>
              <OptionButton
                isSelected={goHomeReminderEnabled}
                label={`Go-home reminder: ${goHomeReminderEnabled ? "on" : "off"}`}
                onPress={() => setGoHomeReminderEnabled((enabled) => !enabled)}
              />
            </View>
          </View>
        </View>

        <Pressable onPress={handleStartSession} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Session</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
        placeholderTextColor="#8b9692"
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
    backgroundColor: "#f7f4ef",
  },
  screen: {
    gap: 20,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#f7f4ef",
  },
  title: {
    color: "#1f2a2e",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
  },
  presetCard: {
    gap: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  presetCardSelected: {
    borderColor: "#2f6f62",
    backgroundColor: "#e3eee9",
  },
  presetName: {
    color: "#1f2a2e",
    fontSize: 17,
    fontWeight: "800",
  },
  presetDetail: {
    color: "#2f6f62",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  guidanceCard: {
    gap: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff7df",
    borderColor: "#ead48b",
    borderWidth: 1,
  },
  guidanceTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  guidanceText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#1f2a2e",
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
    color: "#1f2a2e",
    fontSize: 18,
  },
  inputError: {
    borderColor: "#b65353",
  },
  error: {
    color: "#9b3f3f",
    fontSize: 14,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    borderRadius: 8,
    borderColor: "#cfc6ba",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButtonSelected: {
    borderColor: "#2f6f62",
    backgroundColor: "#e3eee9",
  },
  optionButtonText: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "700",
  },
  optionButtonTextSelected: {
    color: "#2f6f62",
  },
  warningCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff7df",
    borderColor: "#ead48b",
    borderWidth: 1,
  },
  warningText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  estimateText: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  summaryCard: {
    gap: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2f6f62",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
