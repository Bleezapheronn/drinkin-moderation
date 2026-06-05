import { router } from "expo-router";
import { useState } from "react";
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

import { useSession } from "../context/session";

type FormErrors = {
  intervalMinutes?: string;
  maxDrinks?: string;
  spendingCap?: string;
};

export default function NewSessionScreen() {
  const { startSession } = useSession();
  const [intervalMinutes, setIntervalMinutes] = useState("60");
  const [maxDrinks, setMaxDrinks] = useState("6");
  const [spendingCap, setSpendingCap] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleStartSession = () => {
    const nextErrors: FormErrors = {};
    const parsedInterval = Number(intervalMinutes);
    const parsedMaxDrinks = Number(maxDrinks);
    const trimmedSpendingCap = spendingCap.trim();
    const parsedSpendingCap = trimmedSpendingCap ? Number(trimmedSpendingCap) : null;

    if (!Number.isFinite(parsedInterval) || parsedInterval <= 0) {
      nextErrors.intervalMinutes = "Use a number greater than 0.";
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

    startSession({
      intervalMinutes: parsedInterval,
      maxDrinks: Math.floor(parsedMaxDrinks),
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
        <Text style={styles.body}>
          Choose practical limits now. You can keep the plan simple and adjust the MVP later.
        </Text>

        <View style={styles.form}>
          <Field
            error={errors.intervalMinutes}
            keyboardType="number-pad"
            label="Drink interval in minutes"
            onChangeText={setIntervalMinutes}
            value={intervalMinutes}
          />
          <Field
            error={errors.maxDrinks}
            keyboardType="number-pad"
            label="Maximum drinks"
            onChangeText={setMaxDrinks}
            value={maxDrinks}
          />
          <Field
            error={errors.spendingCap}
            keyboardType="decimal-pad"
            label="Spending cap"
            onChangeText={setSpendingCap}
            placeholder="Optional"
            value={spendingCap}
          />
        </View>

        <Pressable onPress={handleStartSession} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Session</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
