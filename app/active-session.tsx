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
import { getTotalSpent } from "../utils/session-metrics";

const spendingCategories: SpendingCategory[] = [
  "My drink",
  "Food",
  "Round / other people",
  "Transport",
  "Other",
];

export default function ActiveSessionScreen() {
  const { addSpendingItem, endSession, isRestoring, logDrink, session, storageError } =
    useSession();
  const [now, setNow] = useState(Date.now());
  const [isSpendingModalVisible, setIsSpendingModalVisible] = useState(false);
  const [spendingAmount, setSpendingAmount] = useState("");
  const [spendingNote, setSpendingNote] = useState("");
  const [spendingCategory, setSpendingCategory] = useState<SpendingCategory>("My drink");
  const [spendingError, setSpendingError] = useState<string | null>(null);

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
  };

  const closeSpendingModal = () => {
    resetSpendingForm();
    setIsSpendingModalVisible(false);
  };

  const addSpending = (amount: number) => {
    addSpendingItem({
      amount,
      category: spendingCategory,
      note: spendingNote.trim(),
    });
    closeSpendingModal();
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
      addSpending(amount);
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
          onPress: () => addSpending(amount),
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

        <View style={styles.metrics}>
          <Metric label="Drinks" value={`${session.drinkCount} / ${session.maxDrinks}`} />
          <Metric label="Interval" value={`${session.intervalMinutes} min`} />
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

        {drinkWarning ? (
          <WarningNotice
            body={drinkWarning.body}
            level={drinkWarning.level}
            title={drinkWarning.title}
          />
        ) : null}

        {spendingWarning ? (
          <WarningNotice
            body={spendingWarning.body}
            level={spendingWarning.level}
            title={spendingWarning.title}
          />
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
            <Text style={styles.modalTitle}>Log Spending</Text>
            <Text style={styles.body}>Add what you spent so the plan stays visible.</Text>

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
                <Text style={styles.primaryButtonText}>Add Spending</Text>
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
