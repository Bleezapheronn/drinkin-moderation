import { Stack, router } from "expo-router";
import type { Href } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen, HeroCard, PrimaryButton } from "../components/design-system";
import { SpendingItem, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { formatCurrency } from "../utils/currency";
import { getPacingSummary } from "../utils/pacing";
import {
  getTotalSpent,
  stayedWithinDrinkPlan,
  stayedWithinSpendingPlan,
} from "../utils/session-metrics";
import {
  formatDate,
  formatSessionDuration,
  formatTime,
} from "../utils/session-format";
import { getDrinkingActivityRange } from "../utils/session-timing";

export default function SessionSummaryScreen() {
  const { isRestoring, latestCompletedSession, session, storageError } = useSession();
  const { settings } = useSettings();
  const summarySession = latestCompletedSession ?? session;

  if (isRestoring) {
    return (
      <>
        <BrandedStack />
        <AppScreen>
          <View style={styles.centeredScreen}>
            <Text style={styles.title}>Session Summary</Text>
            <Text style={styles.body}>Checking for the latest saved session summary.</Text>
          </View>
        </AppScreen>
      </>
    );
  }

  if (!summarySession) {
    return (
      <>
        <BrandedStack />
        <AppScreen>
          <View style={styles.centeredScreen}>
            <Text style={styles.title}>Session Summary</Text>
            <Text style={styles.body}>
              There is no session to summarize yet. Start a plan when you are ready.
            </Text>
            <PrimaryButton onPress={() => router.push("/new-session" as Href)}>
              Create a plan
            </PrimaryButton>
          </View>
        </AppScreen>
      </>
    );
  }

  const totalSpent = getTotalSpent(summarySession);
  const activityRange = getDrinkingActivityRange(summarySession);
  const stayedWithinDrinks = stayedWithinDrinkPlan(summarySession);
  const stayedWithinSpending = stayedWithinSpendingPlan(summarySession);
  const hasSpendingCap = summarySession.spendingCap !== null;
  const isWithinPlan = stayedWithinDrinks && stayedWithinSpending;

  return (
    <>
      <BrandedStack />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Session review</Text>
            <Text style={styles.title}>Session Summary</Text>
            <Text style={styles.body}>
              Here is the simple review of the plan you used for this session.
            </Text>
          </View>

          {storageError ? (
            <View style={styles.storageNotice}>
              <Text style={styles.noticeText}>{storageError}</Text>
            </View>
          ) : null}

          <HeroCard style={isWithinPlan ? styles.resultCardPositive : styles.resultCardWarning}>
            <Text style={styles.resultEyebrow}>{isWithinPlan ? "Nice work" : "Plan review"}</Text>
            <Text style={styles.resultTitle}>
              {isWithinPlan ? "You stayed within the plan." : "You have a useful readout."}
            </Text>
            <Text style={styles.resultBody}>
              {isWithinPlan
                ? "The session stayed inside the guardrails you set while clear-headed."
                : "Nothing to punish here. Use the details below to adjust the next plan."}
            </Text>
            <View style={styles.statGrid}>
              <SummaryStat label="Drinks" value={`${summarySession.drinkCount}/${summarySession.maxDrinks}`} />
              <SummaryStat label="Spent" value={formatCurrency(totalSpent, settings.currency)} />
            </View>
          </HeroCard>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Plan details</Text>
            <SummaryRow label="Preset" value={summarySession.presetName ?? "Custom"} />
            <SummaryRow label="Primary drink type" value={summarySession.primaryDrinkType} />
            <SummaryRow label="Date" value={formatDate(activityRange.startedAt)} />
            <SummaryRow label="Start time" value={formatTime(activityRange.startedAt)} />
            <SummaryRow label="End time" value={formatTime(activityRange.endedAt)} />
            <SummaryRow label="Duration" value={formatSessionDuration(summarySession)} />
            <ResultRow
              label="Drink plan"
              value={stayedWithinDrinks ? "Within plan" : "Over plan"}
              isPositive={stayedWithinDrinks}
            />
            <SummaryRow label="Pacing used" value={getPacingSummary(summarySession.pacing)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Spending</Text>
            <SummaryRow label="Total spending" value={formatCurrency(totalSpent, settings.currency)} />
            <SummaryRow
              label="Spending cap"
              value={
                summarySession.spendingCap === null
                  ? "Not set"
                  : formatCurrency(summarySession.spendingCap, settings.currency)
              }
            />
            {hasSpendingCap ? (
              <ResultRow
                label="Spending plan"
                value={stayedWithinSpending ? "Within plan" : "Over plan"}
                isPositive={stayedWithinSpending}
              />
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <SummaryRow
              label="Food reminder enabled"
              value={summarySession.behavioralReminders.foodEnabled ? "Yes" : "No"}
            />
            <SummaryRow
              label="Food reminder triggered"
              value={summarySession.behavioralReminders.foodTriggered ? "Yes" : "No"}
            />
            <SummaryRow
              label="Go-home reminder enabled"
              value={summarySession.behavioralReminders.goHomeEnabled ? "Yes" : "No"}
            />
            <SummaryRow
              label="Go-home reminder triggered"
              value={summarySession.behavioralReminders.goHomeTriggered ? "Yes" : "No"}
            />
          </View>

          {summarySession.spendingItems.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Spending entries</Text>
              {summarySession.spendingItems.map((item) => (
                <SpendingEntry key={item.id} currency={settings.currency} item={item} />
              ))}
            </View>
          ) : null}

          <PrimaryButton onPress={() => router.push("/" as Href)}>Back home</PrimaryButton>
        </ScrollView>
      </AppScreen>
    </>
  );
}

function BrandedStack() {
  return (
    <Stack.Screen
      options={{
        contentStyle: { backgroundColor: colors.wine },
        headerStyle: { backgroundColor: colors.wine },
        headerTintColor: colors.card,
        headerTitleStyle: { color: colors.card, fontWeight: "900" },
        title: "Session Summary",
      }}
    />
  );
}

type SummaryStatProps = {
  label: string;
  value: string;
};

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <View style={styles.summaryStat}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.summaryStatValue}>
        {value}
      </Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type ResultRowProps = SummaryRowProps & {
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
  resultCardPositive: {
    borderColor: colors.accent,
  },
  resultCardWarning: {
    borderColor: colors.borderStrong,
  },
  resultEyebrow: {
    color: colors.accentDark,
    textTransform: "uppercase",
    ...typography.caption,
  },
  resultTitle: {
    color: colors.wineDeep,
    ...typography.screenTitle,
  },
  resultBody: {
    color: colors.muted,
    ...typography.body,
  },
  statGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 76,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  summaryStatValue: {
    color: colors.wineDeep,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  summaryStatLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
  },
  storageNotice: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
  },
  noticeText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
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
    fontSize: 14,
    fontWeight: "800",
  },
  rowValue: {
    color: colors.wineDeep,
    fontSize: 18,
    fontWeight: "900",
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
    fontSize: 15,
    fontWeight: "900",
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
    fontSize: 18,
    fontWeight: "900",
  },
  spendingCategory: {
    flexShrink: 1,
    color: colors.muted,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  spendingNote: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
});
