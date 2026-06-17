import { Stack, router } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen, HeroCard, PrimaryButton } from "../components/design-system";
import { DrinkingSession, SessionPresetName, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";
import { formatCurrency } from "../utils/currency";
import { getSessionDateRange, getSessionSummaryLine, getSessionTitle } from "../utils/session-format";
import { getTotalSpent } from "../utils/session-metrics";

const quickStartPresets: SessionPresetName[] = [
  "Solo / Home",
  "Drinks @Home w/ Company",
  "Night Out",
  "High-Risk Night",
];

export default function HomeScreen() {
  const { completedSessions, isRestoring, session, storageError } = useSession();
  const { isRestoringSettings, settings } = useSettings();
  const [now, setNow] = useState(Date.now());
  const recentSessions = completedSessions.slice(0, 3);

  useEffect(() => {
    if (!isRestoringSettings && !settings.onboardingCompleted) {
      router.replace("/onboarding" as Href);
    }
  }, [isRestoringSettings, settings.onboardingCompleted]);

  useEffect(() => {
    if (!session?.nextAllowedDrinkAt) {
      return;
    }

    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, [session?.nextAllowedDrinkAt]);

  if (isRestoringSettings || !settings.onboardingCompleted) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AppScreen>
          <View style={styles.loadingScreen}>
            <Text style={styles.kicker}>OMD</Text>
            <Text style={styles.loadingTitle}>Getting the app ready.</Text>
          </View>
        </AppScreen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.kicker}>OMD</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={styles.title}
              >
                {"One More Drink"}
              </Text>
              <Text style={styles.subtitle}>Make a sober plan. Stick to it.</Text>
            </View>
            <Pressable
              accessibilityLabel="Settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/settings" as Href)}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>⚙</Text>
            </Pressable>
          </View>

          {storageError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{storageError}</Text>
            </View>
          ) : null}

          {session ? (
            <ActiveSessionCard
              currency={settings.currency}
              isRestoring={isRestoring}
              now={now}
              session={session}
            />
          ) : (
            <HeroCard>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEyebrow}>Tonight plan</Text>
                <Text style={styles.heroCardTitle}>Start a session</Text>
              </View>
              <Text style={styles.cardBody}>
                Choose a preset for a faster setup, or build the plan manually.
              </Text>
              <View style={styles.quickStartGrid}>
                {quickStartPresets.map((presetName) => (
                  <Pressable
                    key={presetName}
                    onPress={() =>
                      router.push({
                        pathname: "/new-session",
                        params: { preset: presetName },
                      } as Href)
                    }
                    style={styles.quickStartButton}
                  >
                    <Text style={styles.quickStartText}>{presetName}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton onPress={() => router.push("/new-session" as Href)}>
                Start a new session
              </PrimaryButton>
            </HeroCard>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {recentSessions.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/session-history" as Href)}
                >
                  <Text style={styles.inlineLink}>View all</Text>
                </Pressable>
              ) : null}
            </View>
            {recentSessions.length > 0 ? (
              recentSessions.map((recentSession, index) => (
                <RecentSessionCard
                  key={`${recentSession.startedAt}-${recentSession.endedAt}`}
                  currency={settings.currency}
                  session={recentSession}
                  sessionIndex={index}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.cardBody}>
                  No completed sessions yet. Your first summary will appear here.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.privacyNote}>
            OMD stores your session data locally on this device.
          </Text>
        </ScrollView>
      </AppScreen>
    </>
  );
}

type ActiveSessionCardProps = {
  currency: "KES" | "USD";
  isRestoring: boolean;
  now: number;
  session: DrinkingSession;
};

function ActiveSessionCard({ currency, isRestoring, now, session }: ActiveSessionCardProps) {
  const totalSpent = getTotalSpent(session);
  const remainingBudget =
    session.spendingCap === null ? null : session.spendingCap - totalSpent;
  const drinksLeft = Math.max(0, session.maxDrinks - session.drinkCount);

  return (
    <View style={styles.activeCard}>
      <View style={styles.goldRule} />
      <View style={styles.activeHeader}>
        <View style={styles.activeTitleBlock}>
          <Text style={styles.cardEyebrow}>In progress</Text>
          <Text style={styles.cardTitle}>Active session</Text>
          <Text style={styles.activeMeta}>
            {getSessionTitle(session)} · {session.primaryDrinkType}
          </Text>
        </View>
      </View>
      <View style={styles.activeStats}>
        <MiniStat label="Drinks left" value={`${drinksLeft}`} />
        <MiniStat label="Next window" value={isRestoring ? "Restoring" : getReadyCopy(session, now)} />
        {remainingBudget !== null ? (
          <MiniStat label="Spending left" value={formatCurrency(remainingBudget, currency)} />
        ) : null}
      </View>
      <PrimaryButton onPress={() => router.push("/active-session" as Href)}>
        Resume session
      </PrimaryButton>
    </View>
  );
}

type MiniStatProps = {
  label: string;
  value: string;
};

function MiniStat({ label, value }: MiniStatProps) {
  return (
    <View style={styles.miniStat}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.miniStatValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.miniStatLabel}>
        {label}
      </Text>
    </View>
  );
}

type RecentSessionCardProps = {
  currency: "KES" | "USD";
  session: DrinkingSession;
  sessionIndex: number;
};

function RecentSessionCard({ currency, session, sessionIndex }: RecentSessionCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/session-detail/${sessionIndex}` as Href)}
      style={styles.recentCard}
    >
      <View style={styles.recentAccent} />
      <View style={styles.recentCopy}>
        <Text style={styles.recentTitle}>{getSessionTitle(session)}</Text>
        <Text style={styles.recentDate}>{getSessionDateRange(session)}</Text>
        <Text style={styles.recentText}>{getSessionSummaryLine(session, currency)}</Text>
      </View>
    </Pressable>
  );
}

function getReadyCopy(session: DrinkingSession, now: number) {
  if (!session.nextAllowedDrinkAt) {
    return "Ready";
  }

  const remainingSeconds = Math.max(0, Math.ceil((session.nextAllowedDrinkAt - now) / 1000));

  if (remainingSeconds <= 0) {
    return "Ready";
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  loadingTitle: {
    color: colors.card,
    ...typography.sectionTitle,
  },
  screen: {
    flexGrow: 1,
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  brandBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  kicker: {
    color: colors.accentLight,
    textTransform: "uppercase",
    ...typography.caption,
  },
  title: {
    color: colors.card,
    ...typography.heroTitle,
    fontSize: 35,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.cardMuted,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 17,
    lineHeight: 24,
  },
  settingsButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  settingsButtonText: {
    color: colors.accentLight,
    fontFamily: fontFamilies.button,
    fontSize: 24,
    lineHeight: 28,
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
  cardHeader: {
    gap: spacing.xs,
  },
  cardEyebrow: {
    color: colors.accentDark,
    textTransform: "uppercase",
    ...typography.caption,
  },
  heroCardTitle: {
    color: colors.wineDeep,
    ...typography.screenTitle,
  },
  cardTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  cardBody: {
    color: colors.muted,
    ...typography.body,
  },
  quickStartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickStartButton: {
    borderRadius: radius.pill,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickStartText: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 19,
  },
  activeCard: {
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    ...shadows.card,
  },
  goldRule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: colors.accent,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  activeTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  activeMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  activeStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  miniStat: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 72,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  miniStatValue: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 20,
    lineHeight: 25,
  },
  miniStatLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.card,
    ...typography.sectionTitle,
  },
  inlineLink: {
    color: colors.accentLight,
    fontFamily: fontFamilies.button,
    fontSize: 15,
    lineHeight: 20,
  },
  recentCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  recentAccent: {
    width: 5,
    backgroundColor: colors.accent,
  },
  recentCopy: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  recentTitle: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  recentDate: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  recentText: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  privacyNote: {
    color: colors.cardMuted,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
