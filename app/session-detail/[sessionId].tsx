import { Stack, router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen, PrimaryButton } from "../../components/design-system";
import { SpendingItem, useSession } from "../../context/session";
import { useSettings } from "../../context/settings";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../../theme";
import { formatCurrency } from "../../utils/currency";
import { getPacingSummary } from "../../utils/pacing";
import {
  getTotalSpent,
  stayedWithinDrinkPlan,
  stayedWithinSpendingPlan,
} from "../../utils/session-metrics";
import {
  formatDate,
  formatSessionDuration,
  formatTime,
  getSessionTitle,
} from "../../utils/session-format";
import { getDrinkingActivityRange } from "../../utils/session-timing";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    completedSessions,
    deleteCompletedSession,
    isRestoring,
    storageError,
  } = useSession();
  const { settings } = useSettings();
  const sessionIndex = Number(sessionId);
  const session = Number.isInteger(sessionIndex) ? completedSessions[sessionIndex] : null;

  const confirmDelete = () => {
    if (!session) {
      return;
    }

    Alert.alert("Delete session", "Delete this completed session? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCompletedSession(sessionIndex);
          router.replace("/session-history" as Href);
        },
      },
    ]);
  };

  if (isRestoring) {
    return (
      <>
        <BrandedStack title="Session Detail" />
        <AppScreen>
          <View style={styles.centeredScreen}>
            <Text style={styles.title}>Session Detail</Text>
            <Text style={styles.body}>Checking saved sessions on this device.</Text>
          </View>
        </AppScreen>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <BrandedStack title="Session Detail" />
        <AppScreen>
          <View style={styles.centeredScreen}>
            <Text style={styles.title}>Session not found</Text>
            <Text style={styles.body}>
              This completed session is no longer saved on this device.
            </Text>
            <PrimaryButton onPress={() => router.replace("/session-history" as Href)}>
              Back to history
            </PrimaryButton>
          </View>
        </AppScreen>
      </>
    );
  }

  const totalSpent = getTotalSpent(session);
  const hasSpendingPlan = session.spendingCap !== null || session.spendingItems.length > 0;
  const activityRange = getDrinkingActivityRange(session);
  const drinkResult = stayedWithinDrinkPlan(session) ? "Within plan" : "Over plan";
  const spendingResult = stayedWithinSpendingPlan(session) ? "Within plan" : "Over plan";

  return (
    <>
      <BrandedStack title="Session Detail" />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Completed session</Text>
            <Text style={styles.title}>{getSessionTitle(session)}</Text>
            <Text style={styles.body}>{formatDate(activityRange.startedAt)}</Text>
          </View>

          {storageError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{storageError}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.goldRule} />
            <DetailRow label="Primary drink type" value={session.primaryDrinkType ?? "Not recorded"} />
            <DetailRow label="Date" value={formatDate(activityRange.startedAt)} />
            <DetailRow label="Start time" value={formatTime(activityRange.startedAt)} />
            <DetailRow label="End time" value={formatTime(activityRange.endedAt)} />
            <DetailRow label="Duration" value={formatSessionDuration(session)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Drink plan</Text>
            <DetailRow label="Total drinks" value={`${session.drinkCount}`} />
            <DetailRow label="Maximum drinks" value={`${session.maxDrinks}`} />
            <ResultRow label="Result" value={drinkResult} isPositive={drinkResult === "Within plan"} />
            <DetailRow label="Pacing used" value={getPacingSummary(session.pacing)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Spending</Text>
            <DetailRow label="Total spending" value={formatCurrency(totalSpent, settings.currency)} />
            <DetailRow
              label="Spending cap"
              value={
                session.spendingCap === null
                  ? "Not set"
                  : formatCurrency(session.spendingCap, settings.currency)
              }
            />
            {hasSpendingPlan ? (
              <ResultRow
                label="Result"
                value={spendingResult}
                isPositive={spendingResult === "Within plan"}
              />
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <DetailRow
              label="Food reminder"
              value={formatReminderState(
                session.behavioralReminders.foodEnabled,
                session.behavioralReminders.foodTriggered,
              )}
            />
            <DetailRow
              label="Go-home reminder"
              value={formatReminderState(
                session.behavioralReminders.goHomeEnabled,
                session.behavioralReminders.goHomeTriggered,
              )}
            />
          </View>

          {session.spendingItems.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Spending entries</Text>
              {session.spendingItems.map((item) => (
                <SpendingEntry key={item.id} currency={settings.currency} item={item} />
              ))}
            </View>
          ) : null}

          <Pressable onPress={confirmDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete session</Text>
          </Pressable>
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

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type ResultRowProps = DetailRowProps & {
  isPositive: boolean;
};

function ResultRow({ isPositive, label, value }: ResultRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.resultPill, isPositive ? styles.resultPillPositive : styles.resultPillWarning]}>
        <Text style={[styles.resultText, isPositive ? styles.resultTextPositive : styles.resultTextWarning]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

type SpendingEntryProps = {
  currency: "KES" | "USD";
  item: SpendingItem;
};

function SpendingEntry({ currency, item }: SpendingEntryProps) {
  return (
    <View style={styles.spendingEntry}>
      <View style={styles.spendingEntryHeader}>
        <Text style={styles.spendingAmount}>{formatCurrency(item.amount, currency)}</Text>
        <Text style={styles.spendingCategory}>{item.category}</Text>
      </View>
      {item.note ? <Text style={styles.spendingNote}>{item.note}</Text> : null}
    </View>
  );
}

function formatReminderState(isEnabled: boolean, isTriggered: boolean) {
  if (!isEnabled) {
    return "Off";
  }

  return isTriggered ? "Enabled and triggered" : "Enabled, not triggered";
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
  card: {
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.border,
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
  sectionTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  row: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  rowValue: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  resultPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultPillPositive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  resultPillWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.borderStrong,
  },
  resultText: {
    fontFamily: fontFamilies.button,
    fontSize: 15,
    lineHeight: 21,
  },
  resultTextPositive: {
    color: colors.success,
  },
  resultTextWarning: {
    color: colors.warning,
  },
  spendingEntry: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  spendingEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  spendingAmount: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  spendingCategory: {
    flexShrink: 1,
    color: colors.muted,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "right",
  },
  spendingNote: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  deleteButtonText: {
    color: colors.destructive,
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
