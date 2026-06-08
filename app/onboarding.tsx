import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSettings } from "../context/settings";

const onboardingSteps = [
  {
    body: "Choose your drink limit, pacing interval, and spending cap before the session starts.",
    title: "Make the plan while sober",
  },
  {
    body: "DIM tracks the interval, reminds you when the drink window is open, and keeps the plan visible.",
    title: "Let DIM handle the timing",
  },
  {
    body: "Afterward, review what happened and adjust your next plan.",
    title: "Review without judgment",
  },
];

export default function OnboardingScreen() {
  const { updateSettings } = useSettings();
  const [stepIndex, setStepIndex] = useState(0);
  const step = onboardingSteps[stepIndex];
  const isFinalStep = stepIndex === onboardingSteps.length - 1;

  const handleNext = () => {
    if (!isFinalStep) {
      setStepIndex((currentStep) => currentStep + 1);
      return;
    }

    updateSettings({ onboardingCompleted: true });
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>DIM</Text>
        <Text style={styles.tagline}>Make a sober plan. Keep it.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepCount}>
          {stepIndex + 1} of {onboardingSteps.length}
        </Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>

      <View style={styles.dots}>
        {onboardingSteps.map((item, index) => (
          <View
            key={item.title}
            style={[styles.dot, index === stepIndex ? styles.dotActive : null]}
          />
        ))}
      </View>

      <Pressable onPress={handleNext} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>
          {isFinalStep ? "Start using DIM" : "Next"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    gap: 24,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 8,
  },
  kicker: {
    color: "#2f6f62",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  tagline: {
    color: "#1f2a2e",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  card: {
    gap: 14,
    padding: 22,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  stepCount: {
    color: "#2f6f62",
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: "#1f2a2e",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  body: {
    color: "#52605f",
    fontSize: 17,
    lineHeight: 25,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#d6d1c8",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#2f6f62",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2f6f62",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
});
