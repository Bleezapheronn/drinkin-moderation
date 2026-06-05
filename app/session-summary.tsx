import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SpendingItem, useSession } from "../context/session";
import { formatCurrency } from "../utils/currency";
import {
  getTotalSpent,
  stayedWithinDrinkPlan,
  stayedWithinSpendingPlan,
} from "../utils/session-metrics";

export default function SessionSummaryScreen() {
  const { isRestoring, latestCompletedSession, session, storageError } = useSession();
  const summarySession = latestCompletedSession ?? session;

  if (isRestoring) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Session Summary</Text>
        <Text style={styles.body}>Checking for the latest saved session summary.</Text>
      </View>
    );
  }

  if (!summarySession) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Session Summary</Text>
        <Text style={styles.body}>
          There is no session to summarize yet. Start a plan when you are ready.
        </Text>
        <Link href="/new-session" style={styles.primaryButton}>
          Create a plan
        </Link>
      </View>
    );
  }

  const totalSpent = getTotalSpent(summarySession);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Session Summary</Text>
      <Text style={styles.body}>
        Here is the simple review of the plan you used for this session.
      </Text>

      {storageError ? (
        <View style={styles.storageNotice}>
          <Text style={styles.body}>{storageError}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <SummaryRow label="Total drinks" value={`${summarySession.drinkCount}`} />
        <SummaryRow label="Maximum drinks" value={`${summarySession.maxDrinks}`} />
        <SummaryRow
          label="Stayed within drink plan"
          value={stayedWithinDrinkPlan(summarySession) ? "Yes" : "No"}
        />
        <SummaryRow label="Interval used" value={`${summarySession.intervalMinutes} minutes`} />
        <SummaryRow label="Total spending" value={formatCurrency(totalSpent)} />
        <SummaryRow
          label="Spending cap"
          value={
            summarySession.spendingCap === null
              ? "Not set"
              : formatCurrency(summarySession.spendingCap)
          }
        />
        <SummaryRow
          label="Stayed within spending plan"
          value={stayedWithinSpendingPlan(summarySession) ? "Yes" : "No"}
        />
      </View>

      {summarySession.spendingItems.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Spending entries</Text>
          {summarySession.spendingItems.map((item) => (
            <SpendingEntry key={item.id} item={item} />
          ))}
        </View>
      ) : null}

      <Link href="/" style={styles.primaryButton}>
        Back home
      </Link>
    </ScrollView>
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

type SpendingEntryProps = {
  item: SpendingItem;
};

function SpendingEntry({ item }: SpendingEntryProps) {
  return (
    <View style={styles.spendingEntry}>
      <View style={styles.spendingEntryHeader}>
        <Text style={styles.spendingAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.spendingCategory}>{item.category}</Text>
      </View>
      {item.note ? <Text style={styles.spendingNote}>{item.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  title: {
    color: "#1f2a2e",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  storageNotice: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
    borderWidth: 1,
  },
  sectionTitle: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "600",
  },
  rowValue: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
  },
  spendingEntry: {
    gap: 6,
    paddingTop: 12,
    borderTopColor: "#e5ded3",
    borderTopWidth: 1,
  },
  spendingEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  spendingAmount: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
  },
  spendingCategory: {
    flexShrink: 1,
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  spendingNote: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#2f6f62",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlign: "center",
  },
});
