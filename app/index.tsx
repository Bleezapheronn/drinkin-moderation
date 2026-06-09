import { Link, router } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DrinkingSession, SessionPresetName, useSession } from "../context/session";
import { useSettings } from "../context/settings";
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
      <View style={styles.loadingScreen}>
        <Text style={styles.kicker}>OMD</Text>
        <Text style={styles.body}>Getting the app ready.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brandBlock}>
          <Text style={styles.kicker}>OMD</Text>
          <Text style={styles.title}>One More Drink</Text>
          <Text style={styles.subtitle}>Make a sober plan. Stick to it.</Text>
        </View>
        <Pressable
          accessibilityLabel="Settings"
          accessibilityRole="button"
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start a session</Text>
          <Text style={styles.body}>
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
          <Link href="/new-session" style={styles.primaryButton}>
            Start a new session
          </Link>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.length > 0 ? (
            <Link href={"/session-history" as Href} style={styles.inlineLink}>
              View all
            </Link>
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
            <Text style={styles.body}>No completed sessions yet. Your first summary will appear here.</Text>
          </View>
        )}
      </View>

      <Text style={styles.privacyNote}>
        OMD stores your session data locally on this device.
      </Text>
    </ScrollView>
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
      <View style={styles.activeHeader}>
        <View>
          <Text style={styles.cardTitle}>Active session</Text>
          <Text style={styles.activeMeta}>{getSessionTitle(session)} · {session.primaryDrinkType}</Text>
        </View>
      </View>
      <View style={styles.activeStats}>
        <MiniStat label="Drinks left" value={`${drinksLeft}`} />
        <MiniStat label="Next window" value={isRestoring ? "Restoring" : getReadyCopy(session, now)} />
        {remainingBudget !== null ? (
          <MiniStat label="Spending left" value={formatCurrency(remainingBudget, currency)} />
        ) : null}
      </View>
      <Link href="/active-session" style={styles.primaryButton}>
        Resume session
      </Link>
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
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
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
      <Text style={styles.recentTitle}>{getSessionTitle(session)}</Text>
      <Text style={styles.recentDate}>{getSessionDateRange(session)}</Text>
      <Text style={styles.recentText}>{getSessionSummaryLine(session, currency)}</Text>
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
    gap: 8,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  screen: {
    flexGrow: 1,
    gap: 22,
    padding: 24,
    paddingTop: 48,
    backgroundColor: "#f7f4ef",
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  brandBlock: {
    flex: 1,
    gap: 5,
  },
  kicker: {
    color: "#3f6f63",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  title: {
    color: "#1f2a2e",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  subtitle: {
    color: "#52605f",
    fontSize: 17,
    lineHeight: 24,
  },
  settingsButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#cfc6ba",
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  settingsButtonText: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
  },
  card: {
    gap: 16,
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  activeCard: {
    gap: 16,
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#b9d6cf",
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  activeMeta: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  activeStats: {
    flexDirection: "row",
    gap: 10,
  },
  miniStat: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f7f4ef",
  },
  miniStatValue: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "900",
  },
  miniStatLabel: {
    color: "#52605f",
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  quickStartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickStartButton: {
    borderRadius: 8,
    borderColor: "#cfc6ba",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickStartText: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryButton: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#2f6f62",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlign: "center",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#1f2a2e",
    fontSize: 22,
    fontWeight: "900",
  },
  inlineLink: {
    color: "#2f6f62",
    fontSize: 15,
    fontWeight: "800",
  },
  recentCard: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  recentTitle: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
  },
  recentDate: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  recentText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  privacyNote: {
    color: "#52605f",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  notice: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
    borderWidth: 1,
  },
  noticeText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
});
