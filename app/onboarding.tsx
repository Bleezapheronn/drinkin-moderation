import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen, HeroCard, PrimaryButton } from "../components/design-system";
import { useSettings } from "../context/settings";
import { colors, radius, shadows, spacing, typography } from "../theme";

const onboardingSteps = [
  {
    body: "Choose a drink limit, pacing interval, and spending cap before the session starts.",
    title: "Make a sober plan",
  },
  {
    body: "OMD keeps the interval visible, tracks spending, and reminds you when the next drink window opens.",
    title: "Pace the session",
  },
  {
    body: "Respect the limit, review what happened, and keep your session data local on this device.",
    title: "Finish with a clear record",
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
    <AppScreen>
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.kicker}>OMD</Text>
          <Text style={styles.tagline}>Make a sober plan. Stick to it.</Text>
          <Text style={styles.intro}>
            A practical guardrail for pacing, spending, and getting home with fewer regrets.
          </Text>
        </View>

        <HeroCard>
          <Text style={styles.stepCount}>
            Step {stepIndex + 1} of {onboardingSteps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.cardBody}>{step.body}</Text>
        </HeroCard>

        <View style={styles.dots}>
          {onboardingSteps.map((item, index) => (
            <View
              key={item.title}
              style={[styles.dot, index === stepIndex ? styles.dotActive : null]}
            />
          ))}
        </View>

        <View style={styles.disclaimerCard}>
          <View style={styles.goldRule} />
          <Text style={styles.disclaimerTitle}>Private by default</Text>
          <Text style={styles.disclaimerText}>
            OMD stores session data locally on this device. One More Drink is a planning and
            harm-reduction tool, not medical advice.
          </Text>
        </View>

        <PrimaryButton onPress={handleNext}>
          {isFinalStep ? "Start using OMD" : "Next"}
        </PrimaryButton>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.sm,
  },
  kicker: {
    color: colors.accentLight,
    textTransform: "uppercase",
    ...typography.caption,
  },
  tagline: {
    color: colors.card,
    ...typography.heroTitle,
  },
  intro: {
    color: colors.cardMuted,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
  },
  stepCount: {
    color: colors.accentDark,
    textTransform: "uppercase",
    ...typography.caption,
  },
  title: {
    color: colors.wineDeep,
    ...typography.screenTitle,
  },
  cardBody: {
    color: colors.muted,
    ...typography.body,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 241, 220, 0.45)",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accentLight,
  },
  disclaimerCard: {
    gap: spacing.xs,
    overflow: "hidden",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  goldRule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.accent,
  },
  disclaimerTitle: {
    color: colors.wineDeep,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  disclaimerText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
