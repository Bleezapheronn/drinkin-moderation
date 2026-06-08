import { router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SpendingItem, useSession } from "../../context/session";
import { useSettings } from "../../context/settings";
import { formatCurrency } from "../../utils/currency";
import { getPacingSummary } from "../../utils/pacing";
import {
  getTotalSpent,
  stayedWithinDrinkPlan,
  stayedWithinSpendingPlan,
} from "../../utils/session-metrics";
import {
  formatDate,
  formatDuration,
  formatTime,
  getSessionTitle,
} from "../../utils/session-format";

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
      <View style={styles.screen}>
        <Text style={styles.title}>Session Detail</Text>
        <Text style={styles.body}>Checking saved sessions on this device.</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Session not found</Text>
        <Text style={styles.body}>
          This completed session is no longer saved on this device.
        </Text>
        <Pressable
          onPress={() => router.replace("/session-history" as Href)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Back to history</Text>
        </Pressable>
      </View>
    );
  }

  const totalSpent = getTotalSpent(session);
  const hasSpendingPlan = session.spendingCap !== null || session.spendingItems.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{getSessionTitle(session)}</Text>
        <Text style={styles.body}>{formatDate(session.startedAt)}</Text>
      </View>

      {storageError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{storageError}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <DetailRow label="Primary drink type" value={session.primaryDrinkType ?? "Not recorded"} />
        <DetailRow label="Date" value={formatDate(session.startedAt)} />
        <DetailRow label="Start time" value={formatTime(session.startedAt)} />
        <DetailRow label="End time" value={formatTime(session.endedAt)} />
        <DetailRow
          label="Duration"
          value={formatDuration(session.startedAt, session.endedAt)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Drink plan</Text>
        <DetailRow label="Total drinks" value={`${session.drinkCount}`} />
        <DetailRow label="Maximum drinks" value={`${session.maxDrinks}`} />
        <DetailRow
          label="Result"
          value={stayedWithinDrinkPlan(session) ? "Within plan" : "Over plan"}
        />
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
          <DetailRow
            label="Result"
            value={stayedWithinSpendingPlan(session) ? "Within plan" : "Over plan"}
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
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 6,
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
    fontWeight: "700",
  },
  rowValue: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
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
  deleteButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#b65353",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: "#9b3f3f",
    fontSize: 16,
    fontWeight: "800",
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
