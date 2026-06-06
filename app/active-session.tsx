import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DrinkingSession, SpendingCategory, useSession } from "../context/session";
import { formatCurrency } from "../utils/currency";
import { getIntervalForNextDrink, getPacingSummary } from "../utils/pacing";
import { getTotalSpent } from "../utils/session-metrics";

const spendingCategories: SpendingCategory[] = [
  "My drink",
  "Food",
  "Round / other people",
  "Transport",
  "Other",
];

export default function ActiveSessionScreen() {
  const {
    addSpendingItem,
    deleteSpendingItem,
    endSession,
    isRestoring,
    logDrink,
    reminderPermissionStatus,
    session,
    storageError,
    undoLastDrink,
    updateSpendingItem,
  } = useSession();
  const [now, setNow] = useState(Date.now());
  const [isSpendingModalVisible, setIsSpendingModalVisible] = useState(false);
  const [spendingAmount, setSpendingAmount] = useState("");
  const [spendingNote, setSpendingNote] = useState("");
  const [spendingCategory, setSpendingCategory] = useState<SpendingCategory>("My drink");
  const [spendingError, setSpendingError] = useState<string | null>(null);
  const [editingSpendingId, setEditingSpendingId] = useState<string | null>(null);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const remainingSeconds = getRemainingSeconds(session, now);
  const hasReachedMax = Boolean(session && session.drinkCount >= session.maxDrinks);
  const isTimerActive = remainingSeconds > 0;
  const canLogDrink = Boolean(session && !session.endedAt && !hasReachedMax && !isTimerActive);
  const nextIntervalMinutes = session ? getIntervalForNextDrink(session) : 0;
  const totalSpent = session ? getTotalSpent(session) : 0;
  const remainingBudget =
    session?.spendingCap === null || !session ? null : session.spendingCap - totalSpent;
  const drinkWarning = session ? getDrinkWarning(session) : null;
  const spendingWarning = session ? getSpendingWarning(session, totalSpent) : null;

  const resetSpendingForm = () => {
    setSpendingAmount("");
    setSpendingNote("");
    setSpendingCategory("My drink");
    setSpendingError(null);
    setEditingSpendingId(null);
  };

  const closeSpendingModal = () => {
    resetSpendingForm();
    setIsSpendingModalVisible(false);
  };

  const saveSpending = (amount: number) => {
    if (editingSpendingId) {
      const existingItem = session?.spendingItems.find((item) => item.id === editingSpendingId);

      if (!existingItem) {
        closeSpendingModal();
        return;
      }

      updateSpendingItem({
        ...existingItem,
        amount,
        category: spendingCategory,
        note: spendingNote.trim(),
      });
      closeSpendingModal();
      return;
    }

    addSpendingItem({
      amount,
      category: spendingCategory,
      note: spendingNote.trim(),
    });
    closeSpendingModal();
  };

  const openEditSpending = (id: string) => {
    const item = session?.spendingItems.find((spendingItem) => spendingItem.id === id);

    if (!item) {
      return;
    }

    setEditingSpendingId(item.id);
    setSpendingAmount(String(item.amount));
    setSpendingNote(item.note);
    setSpendingCategory(item.category);
    setSpendingError(null);
    setIsSpendingModalVisible(true);
  };

  const confirmDeleteSpending = (id: string) => {
    Alert.alert("Delete this spending entry?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSpendingItem(id),
      },
    ]);
  };

  const handleSubmitSpending = () => {
    if (!session) {
      return;
    }

    const amount = Number(spendingAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setSpendingError("Use an amount greater than 0.");
      return;
    }

    setSpendingError(null);

    if (spendingCategory !== "Round / other people") {
      saveSpending(amount);
      return;
    }

    if (editingSpendingId) {
      saveSpending(amount);
      return;
    }

    const wouldExceedCap =
      session.spendingCap !== null && totalSpent + amount > session.spendingCap;

    Alert.alert(
      wouldExceedCap ? "Over spending cap" : "Check the plan",
      wouldExceedCap
        ? "This will push you over your planned spending cap. Sober-you set this limit for a reason. Add it anyway?"
        : "Buying for others can feel good in the moment. Is this still within the plan you set while sober?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: wouldExceedCap ? "Add anyway" : "Add spending",
          onPress: () => saveSpending(amount),
        },
      ],
    );
  };

  const handleLogDrink = () => {
    if (canLogDrink) {
      logDrink();
      setNow(Date.now());
    }
  };

  const confirmUndoLastDrink = () => {
    Alert.alert("Remove the most recent drink log?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove drink",
        style: "destructive",
        onPress: () => {
          undoLastDrink();
          setNow(Date.now());
        },
      },
    ]);
  };

  const handleEndSession = () => {
    endSession();
    router.replace("/session-summary");
  };

  if (isRestoring) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Restoring session</Text>
        <Text style={styles.body}>Checking for a saved active session on this device.</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>No active session</Text>
        <Text style={styles.body}>
          Start a session first so the app can keep the plan in view.
        </Text>
        <Link href="/new-session" style={styles.linkButton}>
          Create a plan
        </Link>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Active Session</Text>
          <Text style={styles.body}>
            Keep following the plan you made before the session started.
          </Text>
        </View>

        {storageError ? (
          <View style={styles.storageNotice}>
            <Text style={styles.noticeBody}>{storageError}</Text>
          </View>
        ) : null}

        <View style={styles.reminderStatus}>
          <Text style={styles.reminderStatusTitle}>Reminders</Text>
          <Text style={styles.reminderStatusBody}>
            {getReminderStatusCopy(reminderPermissionStatus)}
          </Text>
        </View>

        {(session.behavioralReminders.foodEnabled ||
          session.behavioralReminders.goHomeEnabled) ? (
          <View style={styles.behaviorReminderCard}>
            <Text style={styles.behaviorReminderTitle}>Plan reminders</Text>
            {session.behavioralReminders.foodEnabled ? (
              <Text style={styles.behaviorReminderText}>
                Food reminder: {session.behavioralReminders.foodTriggered ? "shown" : "on"}
              </Text>
            ) : null}
            {session.behavioralReminders.goHomeEnabled ? (
              <Text style={styles.behaviorReminderText}>
                Go-home reminder: {session.behavioralReminders.goHomeTriggered ? "shown" : "on"}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.metrics}>
          <Metric label="Preset" value={session.presetName ?? "Custom"} />
          <Metric label="Drink type" value={session.primaryDrinkType} />
          <Metric label="Drinks" value={`${session.drinkCount} / ${session.maxDrinks}`} />
          <Metric label="Next interval" value={`${nextIntervalMinutes} min`} />
          <Metric label="Next drink" value={formatRemainingTime(remainingSeconds)} />
          <Metric label="Spent" value={formatCurrency(totalSpent)} />
          <Metric
            label="Spending cap"
            value={session.spendingCap === null ? "Not set" : formatCurrency(session.spendingCap)}
          />
          {remainingBudget !== null ? (
            <Metric label="Remaining budget" value={formatCurrency(remainingBudget)} />
          ) : null}
        </View>

        <View style={styles.pacingCard}>
          <Text style={styles.pacingTitle}>Pacing rule</Text>
          <Text style={styles.pacingBody}>{getPacingSummary(session.pacing)}</Text>
        </View>

        {drinkWarning ? (
          <WarningNotice
            body={drinkWarning.body}
            level={drinkWarning.level}
            title={drinkWarning.title}
          />
        ) : null}

        {session.behavioralReminders.foodTriggered ? (
          <WarningNotice
            body="Eat something before the night gets away from you."
            level="standard"
            title="Food check"
          />
        ) : null}

        {session.behavioralReminders.goHomeTriggered ? (
          <WarningNotice
            body={
              session.presetName === "High-Risk Night"
                ? "This is a guardrail night. You do not need to win the night. You need to exit it cleanly."
                : "You reached the plan. This is the point where future-you benefits from going home."
            }
            level="final"
            title={session.presetName === "High-Risk Night" ? "Create an exit" : "Time to wrap up"}
          />
        ) : null}

        {spendingWarning ? (
          <WarningNotice
            body={spendingWarning.body}
            level={spendingWarning.level}
            title={spendingWarning.title}
          />
        ) : null}

        {session.spendingItems.length > 0 ? (
          <View style={styles.entriesCard}>
            <Text style={styles.entriesTitle}>Spending entries</Text>
            {session.spendingItems.map((item) => (
              <View key={item.id} style={styles.entryRow}>
                <View style={styles.entryTextBlock}>
                  <Text style={styles.entryAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.entryMeta}>{item.category}</Text>
                  {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
                </View>
                <View style={styles.entryActions}>
                  <Pressable onPress={() => openEditSpending(item.id)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDeleteSpending(item.id)}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            disabled={!canLogDrink}
            onPress={handleLogDrink}
            style={[styles.primaryButton, !canLogDrink ? styles.disabledButton : null]}
          >
            <Text
              style={[styles.primaryButtonText, !canLogDrink ? styles.disabledButtonText : null]}
            >
              Log Drink
            </Text>
          </Pressable>

          {session.drinkCount > 0 ? (
            <Pressable onPress={confirmUndoLastDrink} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Undo last drink</Text>
            </Pressable>
          ) : null}

          {isTimerActive ? (
            <Text style={styles.helperText}>
              The next planned drink is available in {formatRemainingTime(remainingSeconds)}.
            </Text>
          ) : null}

          {hasReachedMax ? (
            <Text style={styles.helperText}>
              Planned maximum reached. Logging another drink is disabled for this session.
            </Text>
          ) : null}

          <Pressable
            onPress={() => setIsSpendingModalVisible(true)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Log Spending</Text>
          </Pressable>

          <Pressable onPress={handleEndSession} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>End Session</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={closeSpendingModal}
        transparent
        visible={isSpendingModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>
              {editingSpendingId ? "Edit Spending" : "Log Spending"}
            </Text>
            <Text style={styles.body}>
              {editingSpendingId
                ? "Adjust the entry so the session stays accurate."
                : "Add what you spent so the plan stays visible."}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setSpendingAmount}
                placeholder="0.00"
                placeholderTextColor="#8b9692"
                style={[styles.input, spendingError ? styles.inputError : null]}
                value={spendingAmount}
              />
              {spendingError ? <Text style={styles.error}>{spendingError}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {spendingCategories.map((category) => {
                  const isSelected = spendingCategory === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => setSpendingCategory(category)}
                      style={[styles.categoryButton, isSelected ? styles.categorySelected : null]}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          isSelected ? styles.categorySelectedText : null,
                        ]}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Note</Text>
              <TextInput
                onChangeText={setSpendingNote}
                placeholder="Optional"
                placeholderTextColor="#8b9692"
                style={styles.input}
                value={spendingNote}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={closeSpendingModal} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitSpending} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {editingSpendingId ? "Save Changes" : "Add Spending"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

type WarningNoticeProps = {
  body: string;
  level: "standard" | "strong" | "final";
  title: string;
};

function WarningNotice({ body, level, title }: WarningNoticeProps) {
  return (
    <View style={[styles.notice, level === "final" ? styles.noticeFinal : null]}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

function getRemainingSeconds(session: DrinkingSession | null, now: number) {
  if (!session?.nextAllowedDrinkAt || session.endedAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((session.nextAllowedDrinkAt - now) / 1000));
}

function formatRemainingTime(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return "Ready";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getDrinkWarning(session: DrinkingSession) {
  const ratio = session.drinkCount / session.maxDrinks;

  if (session.drinkCount >= session.maxDrinks) {
    return {
      level: "final" as const,
      title: "Planned maximum reached",
      body: "You have reached the limit you set. Consider ending the session while the plan is still intact.",
    };
  }

  if (ratio >= 0.75) {
    return {
      level: "strong" as const,
      title: "Close to your planned maximum",
      body: "You are past three quarters of the plan. Slow down and give yourself more time before deciding what comes next.",
    };
  }

  if (ratio >= 0.5) {
    return {
      level: "standard" as const,
      title: "Halfway point reached",
      body: "You are at least halfway through the drinks you planned. Keep the rest of the night steady.",
    };
  }

  return null;
}

function getSpendingWarning(session: DrinkingSession, totalSpent: number) {
  if (session.spendingCap === null) {
    return null;
  }

  const ratio = totalSpent / session.spendingCap;

  if (ratio >= 1) {
    return {
      level: "final" as const,
      title: "Spending cap reached",
      body: "You've reached the spending cap you set while sober. Protect the plan.",
    };
  }

  if (ratio >= 0.75) {
    return {
      level: "strong" as const,
      title: "Close to spending cap",
      body: "You're close to your spending cap. This is a good time to slow spending down.",
    };
  }

  if (ratio >= 0.5) {
    return {
      level: "standard" as const,
      title: "Half of spending plan used",
      body: "You've used half of your planned spending. Keep an eye on the pace.",
    };
  }

  return null;
}

function getReminderStatusCopy(status: string) {
  if (status === "granted") {
    return "Reminders are on for this session.";
  }

  if (status === "denied") {
    return "Reminders are off. You can still use the in-app timer.";
  }

  if (status === "error") {
    return "Reminders could not be scheduled. You can still use the in-app timer.";
  }

  return "Reminders will be requested before the first pacing reminder.";
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 8,
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
  metrics: {
    gap: 12,
  },
  metric: {
    gap: 4,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  metricLabel: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "600",
  },
  metricValue: {
    color: "#1f2a2e",
    fontSize: 22,
    fontWeight: "800",
  },
  notice: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff7df",
    borderColor: "#ead48b",
    borderWidth: 1,
  },
  noticeFinal: {
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
  },
  storageNotice: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
    borderWidth: 1,
  },
  reminderStatus: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  reminderStatusTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  reminderStatusBody: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  pacingCard: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  pacingTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  pacingBody: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  behaviorReminderCard: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  behaviorReminderTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  behaviorReminderText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  entriesCard: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  entriesTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  entryRow: {
    gap: 10,
    paddingTop: 12,
    borderTopColor: "#e5ded3",
    borderTopWidth: 1,
  },
  entryTextBlock: {
    gap: 4,
  },
  entryAmount: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
  },
  entryMeta: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "700",
  },
  entryNote: {
    color: "#52605f",
    fontSize: 14,
    lineHeight: 20,
  },
  entryActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    borderRadius: 8,
    borderColor: "#cfc6ba",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "700",
  },
  noticeTitle: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  noticeBody: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    gap: 12,
    marginTop: "auto",
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
  disabledButton: {
    backgroundColor: "#d6d1c8",
  },
  disabledButtonText: {
    color: "#6d746f",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#cfc6ba",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
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
  helperText: {
    color: "#52605f",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(31, 42, 46, 0.35)",
  },
  modalPanel: {
    gap: 18,
    padding: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#f7f4ef",
  },
  modalTitle: {
    color: "#1f2a2e",
    fontSize: 24,
    fontWeight: "800",
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderRadius: 8,
    borderColor: "#cfc6ba",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categorySelected: {
    borderColor: "#2f6f62",
    backgroundColor: "#e3eee9",
  },
  categoryButtonText: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "700",
  },
  categorySelectedText: {
    color: "#2f6f62",
  },
  modalActions: {
    gap: 12,
  },
});
