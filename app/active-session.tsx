import { Link, Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { DrinkProgressVisual } from "../components/DrinkProgressVisual";
import {
  AppScreen,
  HeroCard,
  InfoStrip,
  PrimaryButton,
  ReminderCard,
  StatCard,
} from "../components/design-system";
import { DrinkingSession, SpendingCategory, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { formatCurrency } from "../utils/currency";
import { getIntervalForNextDrink, getPacingSummary } from "../utils/pacing";
import { formatTime } from "../utils/session-format";
import { getTotalSpent } from "../utils/session-metrics";
import {
  formatEstimatedEndTime,
  getDrinkingActivityRange,
  getEstimatedSessionEnd,
} from "../utils/session-timing";

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
  const { settings } = useSettings();
  const [now, setNow] = useState(Date.now());
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSpendingListExpanded, setIsSpendingListExpanded] = useState(false);
  const [isFoodCheckDismissed, setIsFoodCheckDismissed] = useState(false);
  const [isWaterCheckDismissed, setIsWaterCheckDismissed] = useState(false);
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
  const drinksLeft = session ? Math.max(0, session.maxDrinks - session.drinkCount) : 0;
  const drinkWarning = session ? getDrinkWarning(session) : null;
  const spendingWarning = session ? getSpendingWarning(session, totalSpent) : null;
  const estimatedEnd = session ? getEstimatedSessionEnd(session, now) : null;
  const isSessionWindowComplete = Boolean(
    session && hasReachedMax && estimatedEnd !== null && estimatedEnd <= now,
  );
  const timerCopy = getTimerCopy(remainingSeconds, hasReachedMax, isSessionWindowComplete);
  const completionStripText = session
    ? getCompletionStripText(session, estimatedEnd, isSessionWindowComplete)
    : null;
  const drinkProgressFill = useMemo(
    () => getDrinkProgressFill(session, remainingSeconds),
    [remainingSeconds, session],
  );
  const waterBanner = session
    ? getWaterBannerState(
        session,
        now,
        remainingSeconds,
        isWaterCheckDismissed,
        settings.waterReminder === "in-app",
      )
    : null;
  const primaryGuidance = session
    ? getPrimaryGuidance({
        isFoodCheckDismissed,
        isSessionWindowComplete,
        isTimerActive,
        onDismissFood: () => setIsFoodCheckDismissed(true),
        onDismissWater: waterBanner ? () => setIsWaterCheckDismissed(true) : undefined,
        session,
        waterBanner,
      })
    : null;

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
      <AppScreen>
        <View style={styles.centeredScreen}>
          <Text style={styles.title}>Restoring session</Text>
          <Text style={styles.body}>Checking for a saved active session on this device.</Text>
        </View>
      </AppScreen>
    );
  }

  if (!session) {
    return (
      <AppScreen>
        <View style={styles.centeredScreen}>
          <Text style={styles.title}>No active session</Text>
          <Text style={styles.body}>
            Start a session first so the app can keep the plan in view.
          </Text>
          <Link href="/new-session" style={styles.linkButton}>
            Create a plan
          </Link>
        </View>
      </AppScreen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.wine },
          headerStyle: { backgroundColor: colors.wine },
          headerTintColor: colors.card,
          headerTitleStyle: { color: colors.card, fontSize: 28, fontWeight: "900" },
          title: "Active Session",
        }}
      />
      <AppScreen>
      <ScrollView contentContainerStyle={styles.screen}>
        <HeroCard>
          <View style={styles.sessionMeta}>
            <Text style={styles.flourish}>-</Text>
            <Text style={styles.presetName}>{session.presetName ?? "Custom session"}</Text>
            <Text style={styles.flourish}>-</Text>
          </View>
          <View style={styles.drinkTypeRow}>
            <Text style={styles.drinkTypeDot}>.</Text>
            <Text style={styles.drinkType}>{session.primaryDrinkType}</Text>
            <Text style={styles.drinkTypeDot}>.</Text>
          </View>

          <DrinkProgressVisual drinkType={session.primaryDrinkType} fillLevel={drinkProgressFill} />

          <View style={styles.timerBlock}>
            <Text style={[styles.timerText, timerCopy.isComplete ? styles.completeText : null]}>
              {timerCopy.title}
            </Text>
            <Text style={styles.timerSubtext}>{timerCopy.subtitle}</Text>
          </View>

          <PrimaryButton
            disabled={!canLogDrink}
            onPress={handleLogDrink}
          >
            Log drink
          </PrimaryButton>
        </HeroCard>

        <View style={styles.quickStats}>
          <QuickStat
            actionAccessibilityLabel="Undo last drink"
            actionIcon="↶"
            isActionDisabled={session.drinkCount === 0}
            label="Drinks left"
            onActionPress={confirmUndoLastDrink}
            value={`${drinksLeft}`}
          />
          <QuickStat
            actionAccessibilityLabel="Log spending"
            actionIcon="+"
            label={remainingBudget !== null ? "Spending left" : "Spent"}
            onActionPress={() => setIsSpendingModalVisible(true)}
            value={formatCurrency(remainingBudget ?? totalSpent, settings.currency)}
          />
        </View>

        {completionStripText ? (
          <InfoStrip icon={<Text style={styles.infoIconText}>i</Text>}>{completionStripText}</InfoStrip>
        ) : null}

        {primaryGuidance ? (
          <GuidanceNotice
            body={primaryGuidance.body}
            level={primaryGuidance.level}
            onDismiss={primaryGuidance.onDismiss}
            title={primaryGuidance.title}
          />
        ) : null}

        {storageError ? (
          <View style={styles.storageNotice}>
            <Text style={styles.noticeBody}>{storageError}</Text>
          </View>
        ) : null}

        {drinkWarning && !primaryGuidance ? (
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

        <View style={styles.secondaryActions}>
          <Pressable onPress={handleEndSession} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>End session</Text>
          </Pressable>
        </View>

        <CollapsibleSection
          isExpanded={isDetailsExpanded}
          onToggle={() => setIsDetailsExpanded((current) => !current)}
          title="Session details"
        >
          <View style={styles.detailGrid}>
            <Metric label="Pacing rule" value={getPacingSummary(session.pacing)} />
            <Metric label="Interval now" value={`${nextIntervalMinutes} min`} />
            <Metric label="Reminders" value={getReminderStatusCopy(reminderPermissionStatus)} />
            <Metric
              label="Food reminder"
              value={
                session.behavioralReminders.foodEnabled
                  ? session.behavioralReminders.foodTriggered
                    ? "Shown"
                    : "On"
                  : "Off"
              }
            />
            <Metric
              label="Go-home reminder"
              value={
                session.behavioralReminders.goHomeEnabled
                  ? session.behavioralReminders.goHomeTriggered
                    ? "Shown"
                    : "On"
                  : "Off"
              }
            />
            <Metric
              label="Spending cap"
              value={
                session.spendingCap === null
                  ? "Not set"
                  : formatCurrency(session.spendingCap, settings.currency)
              }
            />
            <Metric label="Total spending" value={formatCurrency(totalSpent, settings.currency)} />
          </View>
        </CollapsibleSection>

        {session.spendingItems.length > 0 ? (
          <CollapsibleSection
            isExpanded={isSpendingListExpanded}
            onToggle={() => setIsSpendingListExpanded((current) => !current)}
            title={`Spending entries (${session.spendingItems.length})`}
          >
            <View style={styles.entriesList}>
              {session.spendingItems.map((item) => (
                <View key={item.id} style={styles.entryRow}>
                  <View style={styles.entryTextBlock}>
                    <Text style={styles.entryAmount}>
                      {formatCurrency(item.amount, settings.currency)}
                    </Text>
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
          </CollapsibleSection>
        ) : null}
      </ScrollView>
      </AppScreen>

      <Modal
        animationType="slide"
        onRequestClose={closeSpendingModal}
        transparent
        visible={isSpendingModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>
              {editingSpendingId ? "Edit spending" : "Log spending"}
            </Text>
            <Text style={styles.modalBody}>
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
                  {editingSpendingId ? "Save changes" : "Add spending"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type QuickStatProps = {
  actionAccessibilityLabel: string;
  actionIcon: string;
  isActionDisabled?: boolean;
  label: string;
  onActionPress: () => void;
  value: string;
};

function QuickStat({
  actionAccessibilityLabel,
  actionIcon,
  isActionDisabled = false,
  label,
  onActionPress,
  value,
}: QuickStatProps) {
  const iconLabel = label === "Drinks left" ? "D" : "$";

  return (
    <StatCard
      icon={<Text style={styles.statIconText}>{iconLabel}</Text>}
      label={label}
      value={value}
      action={
        <Pressable
          accessibilityLabel={actionAccessibilityLabel}
          accessibilityRole="button"
          disabled={isActionDisabled}
          onPress={onActionPress}
          style={[styles.quickStatAction, isActionDisabled ? styles.quickStatActionDisabled : null]}
        >
          <Text
            style={[
              styles.quickStatActionText,
              isActionDisabled ? styles.quickStatActionTextDisabled : null,
            ]}
          >
            {actionIcon}
          </Text>
        </Pressable>
      }
    />
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

type CollapsibleSectionProps = {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
};

function CollapsibleSection({ children, isExpanded, onToggle, title }: CollapsibleSectionProps) {
  return (
    <View style={styles.collapsible}>
      <Pressable onPress={onToggle} style={styles.collapsibleHeader}>
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Text style={styles.collapsibleIndicator}>{isExpanded ? "Hide" : "Show"}</Text>
      </Pressable>
      {isExpanded ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  );
}

type WarningNoticeProps = {
  body: string;
  level: "standard" | "strong" | "final";
  title: string;
};

function WarningNotice({ body, level, title }: WarningNoticeProps) {
  return <ReminderCard body={body} level={level} title={title} />;
}

type GuidanceNoticeProps = WarningNoticeProps & {
  onDismiss?: () => void;
};

function GuidanceNotice({ body, level, onDismiss, title }: GuidanceNoticeProps) {
  return <ReminderCard body={body} level={level} onDismiss={onDismiss} title={title} />;
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

function getTimerCopy(
  remainingSeconds: number,
  hasReachedMax: boolean,
  isSessionWindowComplete: boolean,
) {
  if (isSessionWindowComplete) {
    return {
      isComplete: true,
      subtitle: "That's it for this session.",
      title: "Plan complete.",
    };
  }

  if (remainingSeconds > 0) {
    return {
      isComplete: false,
      subtitle: hasReachedMax ? "until closing time" : "until next drink window",
      title: formatRemainingTime(remainingSeconds),
    };
  }

  return {
    isComplete: false,
    subtitle: "Check in before deciding on another drink.",
    title: "Ready",
  };
}

function getCompletionStripText(
  session: DrinkingSession,
  estimatedEnd: number | null,
  isSessionWindowComplete: boolean,
) {
  if (!isSessionWindowComplete) {
    return estimatedEnd ? formatEstimatedEndTime(estimatedEnd) : null;
  }

  const completedAt = getDrinkingActivityRange(session).endedAt;

  if (!completedAt) {
    return null;
  }

  const completedAtTime = formatTime(completedAt);

  return completedAtTime === "Not recorded" ? null : `Completed at: ${completedAtTime}`;
}

function getDrinkProgressFill(session: DrinkingSession | null, remainingSeconds: number) {
  if (!session || remainingSeconds <= 0) {
    return 0;
  }

  const latestDrinkLog = session.drinkLogs.at(-1);
  const intervalMinutes = latestDrinkLog?.intervalMinutes ?? getIntervalForNextDrink(session);
  const intervalSeconds = Math.max(1, intervalMinutes * 60);

  return remainingSeconds / intervalSeconds;
}

function getWaterBannerState(
  session: DrinkingSession,
  now: number,
  remainingSeconds: number,
  isWaterCheckDismissed: boolean,
  isWaterReminderEnabled: boolean,
) {
  const latestDrinkLog = session.drinkLogs.at(-1);

  if (
    !isWaterReminderEnabled ||
    isWaterCheckDismissed ||
    !latestDrinkLog ||
    !session.nextAllowedDrinkAt ||
    remainingSeconds <= 0
  ) {
    return null;
  }

  const halfwayAt = latestDrinkLog.loggedAt + (latestDrinkLog.intervalMinutes * 60 * 1000) / 2;

  return now >= halfwayAt ? { logId: latestDrinkLog.id } : null;
}

type PrimaryGuidanceInput = {
  isFoodCheckDismissed: boolean;
  isSessionWindowComplete: boolean;
  isTimerActive: boolean;
  onDismissFood: () => void;
  onDismissWater?: () => void;
  session: DrinkingSession;
  waterBanner: { logId: string } | null;
};

function getPrimaryGuidance({
  isFoodCheckDismissed,
  isSessionWindowComplete,
  isTimerActive,
  onDismissFood,
  onDismissWater,
  session,
  waterBanner,
}: PrimaryGuidanceInput): GuidanceNoticeProps | null {
  const hasReachedMax = session.drinkCount >= session.maxDrinks;

  if (isSessionWindowComplete) {
    return {
      body: "Let's call it a night. There's always a next time.",
      level: "final",
      title: "Closing time",
    };
  }

  if (hasReachedMax && isTimerActive) {
    return {
      body: "You stuck to the plan. Now bring it home.",
      level: "final",
      title: "Last call",
    };
  }

  if (session.behavioralReminders.foodTriggered && !isFoodCheckDismissed) {
    return {
      body: "Eat something before the night gets away from you.",
      level: "standard",
      onDismiss: onDismissFood,
      title: "Food check",
    };
  }

  if (waterBanner && onDismissWater) {
    return {
      body: "Water check: have some water and watch your pace.",
      level: "standard",
      onDismiss: onDismissWater,
      title: "Water check",
    };
  }

  return null;
}

function getDrinkWarning(session: DrinkingSession) {
  const ratio = session.drinkCount / session.maxDrinks;

  if (session.drinkCount >= session.maxDrinks) {
    return null;
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
    return "Next-drink and exit reminders are on. Food and water checks appear in-app.";
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
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  dashboard: {
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  sessionMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  flourish: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  presetName: {
    color: colors.wineDeep,
    textAlign: "center",
    ...typography.heroTitle,
  },
  drinkTypeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: -spacing.md,
  },
  drinkType: {
    color: colors.accentDark,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  drinkTypeDot: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  timerBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  timerText: {
    color: colors.wine,
    textAlign: "center",
    ...typography.numericTimer,
  },
  completeText: {
    color: colors.success,
    fontSize: 38,
    lineHeight: 46,
  },
  timerSubtext: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25,
    textAlign: "center",
  },
  quickStats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickStat: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  quickStatHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  quickStatTextBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  quickStatValue: {
    color: "#1f2a2e",
    fontSize: 22,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: "#52605f",
    fontSize: 13,
    fontWeight: "700",
  },
  quickStatAction: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  quickStatActionDisabled: {
    opacity: 0.45,
  },
  quickStatActionText: {
    color: colors.accentDark,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  quickStatActionTextDisabled: {
    color: colors.mutedLight,
  },
  statIconText: {
    color: colors.accentLight,
    fontSize: 24,
    fontWeight: "900",
  },
  infoIconText: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: "900",
  },
  estimateCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  estimateText: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  dismissText: {
    color: "#2f6f62",
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: colors.card,
    ...typography.screenTitle,
  },
  body: {
    color: colors.cardMuted,
    ...typography.body,
  },
  metric: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.wineDeep,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
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
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
  },
  noticeTitle: {
    flex: 1,
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  noticeHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  noticeBody: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  secondaryActions: {
    gap: spacing.md,
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.gold,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  disabledButton: {
    backgroundColor: "#d8c8a6",
  },
  disabledButtonText: {
    color: colors.muted,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.wineDeep,
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    textAlign: "center",
  },
  collapsible: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: "hidden",
  },
  collapsibleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
  },
  collapsibleTitle: {
    color: colors.wineDeep,
    fontSize: 17,
    fontWeight: "800",
  },
  collapsibleIndicator: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: "800",
  },
  collapsibleBody: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  detailGrid: {
    gap: 4,
  },
  entriesList: {
    gap: spacing.md,
  },
  entryRow: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  entryTextBlock: {
    gap: 4,
  },
  entryAmount: {
    color: colors.wineDeep,
    fontSize: 18,
    fontWeight: "800",
  },
  entryMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  entryNote: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  entryActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.cardMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: colors.wineDeep,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalPanel: {
    gap: spacing.lg,
    padding: spacing.xxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
  },
  modalTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  modalBody: {
    color: colors.muted,
    ...typography.body,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.wineDeep,
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 18,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  error: {
    color: colors.destructive,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categorySelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  categoryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  categorySelectedText: {
    color: colors.accentDark,
  },
  modalActions: {
    gap: spacing.md,
  },
});
