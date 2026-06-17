import { Stack, router } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "../components/design-system";
import { DrinkingSession, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";
import {
  getSessionDateRange,
  getSessionSummaryLine,
  getSessionTitle,
} from "../utils/session-format";

export default function SessionHistoryScreen() {
  const { completedSessions, isRestoring, storageError } = useSession();
  const { settings } = useSettings();

  if (isRestoring) {
    return (
      <>
        <BrandedStack title="Session History" />
        <AppScreen>
          <View style={styles.centeredScreen}>
            <Text style={styles.title}>Session History</Text>
            <Text style={styles.body}>Checking saved sessions on this device.</Text>
          </View>
        </AppScreen>
      </>
    );
  }

  return (
    <>
      <BrandedStack title="Session History" />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Completed plans</Text>
            <Text style={styles.title}>Session History</Text>
            <Text style={styles.body}>Review completed sessions without changing them.</Text>
          </View>

          {storageError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{storageError}</Text>
            </View>
          ) : null}

          {completedSessions.length > 0 ? (
            <View style={styles.list}>
              {completedSessions.map((session, index) => (
                <HistoryCard
                  key={`${session.startedAt}-${session.endedAt}`}
                  currency={settings.currency}
                  sessionIndex={index}
                  session={session}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.goldRule} />
              <Text style={styles.emptyTitle}>No completed sessions yet</Text>
              <Text style={styles.cardText}>
                Start and complete a session to build a local history here.
              </Text>
            </View>
          )}
        </ScrollView>
      </AppScreen>
    </>
  );
}

type BrandedStackProps = {
  title: string;
};

function BrandedStack({ title }: BrandedStackProps) {
  return (
    <Stack.Screen
      options={{
        contentStyle: { backgroundColor: colors.wine },
        headerStyle: { backgroundColor: colors.wine },
        headerTintColor: colors.card,
        headerTitleStyle: { color: colors.card, fontFamily: fontFamilies.cardTitle },
        title,
      }}
    />
  );
}

type HistoryCardProps = {
  currency: "KES" | "USD";
  session: DrinkingSession;
  sessionIndex: number;
};

function HistoryCard({ currency, session, sessionIndex }: HistoryCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/session-detail/${sessionIndex}` as Href)}
      style={styles.card}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{getSessionTitle(session)}</Text>
        <Text style={styles.cardMeta}>{getSessionDateRange(session)}</Text>
        <Text style={styles.cardText}>{getSessionSummaryLine(session, currency)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxl,
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
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  cardAccent: {
    width: 5,
    backgroundColor: colors.accent,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  cardMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  cardText: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyCard: {
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
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
  emptyTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
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
