import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { useSettings } from "./settings";
import type { ReminderSoundSetting } from "./settings";
import {
  cancelAllDimSessionReminders,
  cancelSessionReminders,
  reconcileSessionReminders,
  ReminderPermissionStatus,
  requestReminderPermissions,
  sendBehavioralReminder,
  scheduleSessionReminders,
} from "../utils/session-notifications";
import { getIntervalForNextDrink } from "../utils/pacing";

export type SessionPresetName =
  | "Solo / Home"
  | "Drinks @Home w/ Company"
  | "Night Out"
  | "High-Risk Night";

export type PrimaryDrinkType =
  | "Beer"
  | "Wine"
  | "Spirits / liquor"
  | "Cocktails"
  | "Mixed"
  | "Non-alcoholic / tracking only";

export type PacingConfig =
  | {
      intervalMinutes: number;
      type: "fixed";
    }
  | {
      firstIntervalMinutes: number;
      laterIntervalMinutes: number;
      switchAfterDrink: number;
      type: "dynamic";
    };

export type SessionConfig = {
  behavioralReminders: BehavioralReminderState;
  intervalMinutes: number;
  maxDrinks: number;
  pacing: PacingConfig;
  presetName: SessionPresetName | null;
  primaryDrinkType: PrimaryDrinkType;
  spendingCap: number | null;
};

export type BehavioralReminderState = {
  foodEnabled: boolean;
  foodTriggered: boolean;
  goHomeEnabled: boolean;
  goHomeTriggered: boolean;
};

export type SpendingCategory =
  | "My drink"
  | "Food"
  | "Round / other people"
  | "Transport"
  | "Other";

export type SpendingItem = {
  id: string;
  amount: number;
  category: SpendingCategory;
  note: string;
  createdAt: number;
};

export type DrinkLog = {
  id: string;
  intervalMinutes: number;
  loggedAt: number;
};

export type SessionNotificationIds = {
  nextDrinkReminderId: string;
  waterReminderId: string | null;
};

export type DrinkingSession = SessionConfig & {
  drinkCount: number;
  drinkLogs: DrinkLog[];
  startedAt: number;
  endedAt: number | null;
  nextAllowedDrinkAt: number | null;
  notificationIds: SessionNotificationIds | null;
  spendingItems: SpendingItem[];
};

type SessionContextValue = {
  session: DrinkingSession | null;
  completedSessions: DrinkingSession[];
  latestCompletedSession: DrinkingSession | null;
  isRestoring: boolean;
  reminderPermissionStatus: ReminderPermissionStatus;
  storageError: string | null;
  startSession: (config: SessionConfig) => void;
  logDrink: () => void;
  undoLastDrink: () => void;
  addSpendingItem: (item: Omit<SpendingItem, "id" | "createdAt">) => void;
  updateSpendingItem: (item: SpendingItem) => void;
  deleteSpendingItem: (id: string) => void;
  deleteCompletedSession: (sessionIndex: number) => void;
  clearCompletedSessions: () => void;
  endSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const activeSessionKey = "dim.activeSession";
const completedSessionsKey = "dim.completedSessions";
const latestCompletedSessionKey = "dim.latestCompletedSession";

export function SessionProvider({ children }: PropsWithChildren) {
  const { settings } = useSettings();
  const [session, setSession] = useState<DrinkingSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<DrinkingSession[]>([]);
  const [latestCompletedSession, setLatestCompletedSession] = useState<DrinkingSession | null>(
    null,
  );
  const [isRestoring, setIsRestoring] = useState(true);
  const [reminderPermissionStatus, setReminderPermissionStatus] =
    useState<ReminderPermissionStatus>("unknown");
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSessions() {
      try {
        const [activeValue, completedValue, latestValue] = await Promise.all([
          AsyncStorage.getItem(activeSessionKey),
          AsyncStorage.getItem(completedSessionsKey),
          AsyncStorage.getItem(latestCompletedSessionKey),
        ]);

        const restoredActiveSession = activeValue ? parseSession(activeValue) : null;

        setSession(restoredActiveSession);
        setCompletedSessions(completedValue ? parseSessions(completedValue) : []);
        setLatestCompletedSession(latestValue ? parseSession(latestValue) : null);

        if (restoredActiveSession) {
          void reconcileRestoredSession(restoredActiveSession);
        }
      } catch {
        setStorageError("Stored session data could not be loaded. You can keep using the app.");
      } finally {
        setIsRestoring(false);
      }
    }

    void restoreSessions();
  }, []);

  const persistActiveSession = (nextSession: DrinkingSession | null) => {
    const write = nextSession
      ? AsyncStorage.setItem(activeSessionKey, JSON.stringify(nextSession))
      : AsyncStorage.removeItem(activeSessionKey);

    write.catch(() => {
      setStorageError("Session changes could not be saved on this device.");
    });
  };

  const persistCompletedSessions = (nextSessions: DrinkingSession[]) => {
    AsyncStorage.setItem(completedSessionsKey, JSON.stringify(nextSessions)).catch(() => {
      setStorageError("Completed sessions could not be saved on this device.");
    });
  };

  const persistLatestCompletedSession = (nextSession: DrinkingSession | null) => {
    const write = nextSession
      ? AsyncStorage.setItem(latestCompletedSessionKey, JSON.stringify(nextSession))
      : AsyncStorage.removeItem(latestCompletedSessionKey);

    write.catch(() => {
      setStorageError("Session summary could not be saved on this device.");
    });
  };

  const storeReminderResult = (
    scheduledSession: DrinkingSession,
    ids: SessionNotificationIds | null,
  ) => {
    const nextSession = {
      ...scheduledSession,
      notificationIds: ids,
    };

    setSession((current) => {
      if (
        !current ||
        current.startedAt !== scheduledSession.startedAt ||
        current.nextAllowedDrinkAt !== scheduledSession.nextAllowedDrinkAt
      ) {
        return current;
      }

      persistActiveSession(nextSession);
      return nextSession;
    });
  };

  const scheduleAndStoreReminders = async (scheduledSession: DrinkingSession) => {
    const result = await scheduleSessionReminders(scheduledSession, {
      intervalReminderSound: settings.intervalReminderSound,
      intervalReminderVibrate: settings.intervalReminderVibrate,
      nextDrinkPhoneNotifications: settings.nextDrinkPhoneNotifications,
    });

    setReminderPermissionStatus(result.status);
    storeReminderResult(scheduledSession, result.ids);
  };

  const getReminderPreferences = () => ({
    intervalReminderSound: settings.intervalReminderSound,
    intervalReminderVibrate: settings.intervalReminderVibrate,
    nextDrinkPhoneNotifications: settings.nextDrinkPhoneNotifications,
  });

  const reconcileRestoredSession = async (restoredSession: DrinkingSession) => {
    const result = await reconcileSessionReminders(restoredSession, getReminderPreferences());

    setReminderPermissionStatus(result.status);
    storeReminderResult(restoredSession, result.ids);
  };

  const rescheduleSessionRemindersForSettings = async (restoredSession: DrinkingSession) => {
    const result = await scheduleSessionReminders(restoredSession, getReminderPreferences());

    setReminderPermissionStatus(result.status);
    storeReminderResult(restoredSession, result.ids);
  };

  useEffect(() => {
    if (!isRestoring && session?.nextAllowedDrinkAt) {
      void rescheduleSessionRemindersForSettings(session);
    }
  }, [
    settings.intervalReminderSound,
    settings.intervalReminderVibrate,
    settings.nextDrinkPhoneNotifications,
  ]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      completedSessions,
      latestCompletedSession,
      isRestoring,
      reminderPermissionStatus,
      storageError,
      startSession: (config) => {
        const nextSession = {
          ...config,
          drinkCount: 0,
          drinkLogs: [],
          startedAt: Date.now(),
          endedAt: null,
          nextAllowedDrinkAt: null,
          notificationIds: null,
          spendingItems: [],
        };

        setStorageError(null);
        setSession(nextSession);
        persistActiveSession(nextSession);
        void requestReminderPermissions().then(setReminderPermissionStatus);
      },
      logDrink: () => {
        if (!session || session.endedAt || session.drinkCount >= session.maxDrinks) {
          return;
        }

        const loggedAt = Date.now();
        const intervalMinutes = getIntervalForNextDrink(session);
        const nextDrinkCount = session.drinkCount + 1;
        const behavioralReminders = getBehavioralReminderStateAfterDrink(session, nextDrinkCount);
        const nextSession = {
          ...session,
          behavioralReminders,
          drinkCount: nextDrinkCount,
          drinkLogs: [
            ...session.drinkLogs,
            {
              id: `${loggedAt}-${session.drinkLogs.length}`,
              intervalMinutes,
              loggedAt,
            },
          ],
          nextAllowedDrinkAt: loggedAt + intervalMinutes * 60 * 1000,
          notificationIds: session.notificationIds,
        };

        setSession(nextSession);
        persistActiveSession(nextSession);
        void scheduleAndStoreReminders(nextSession);
        void sendTriggeredBehavioralReminders(
          session,
          nextSession,
          settings.goHomePhoneNotifications,
          settings.goHomeReminderSound,
          settings.goHomeReminderVibrate,
        );
      },
      undoLastDrink: () => {
        if (!session || session.endedAt || session.drinkCount <= 0) {
          return;
        }

        const nextDrinkLogs = session.drinkLogs.slice(0, -1);
        const latestDrinkLog = nextDrinkLogs.at(-1);
        const nextSession = {
          ...session,
          drinkCount: Math.max(0, session.drinkCount - 1),
          drinkLogs: nextDrinkLogs,
          nextAllowedDrinkAt: latestDrinkLog
            ? latestDrinkLog.loggedAt + latestDrinkLog.intervalMinutes * 60 * 1000
            : null,
          notificationIds: session.notificationIds,
        };

        setSession(nextSession);
        persistActiveSession(nextSession);

        if (nextSession.nextAllowedDrinkAt) {
          void scheduleAndStoreReminders(nextSession);
        } else {
          void cancelSessionReminders(session.notificationIds);
          persistActiveSession({
            ...nextSession,
            notificationIds: null,
          });
          setSession({
            ...nextSession,
            notificationIds: null,
          });
        }
      },
      addSpendingItem: (item) => {
        setSession((current) => {
          if (!current || current.endedAt) {
            return current;
          }

          const nextSession = {
            ...current,
            spendingItems: [
              ...current.spendingItems,
              {
                ...item,
                id: `${Date.now()}-${current.spendingItems.length}`,
                createdAt: Date.now(),
              },
            ],
          };

          persistActiveSession(nextSession);
          return nextSession;
        });
      },
      updateSpendingItem: (item) => {
        setSession((current) => {
          if (!current || current.endedAt) {
            return current;
          }

          const nextSession = {
            ...current,
            spendingItems: current.spendingItems.map((spendingItem) =>
              spendingItem.id === item.id ? item : spendingItem,
            ),
          };

          persistActiveSession(nextSession);
          return nextSession;
        });
      },
      deleteSpendingItem: (id) => {
        setSession((current) => {
          if (!current || current.endedAt) {
            return current;
          }

          const nextSession = {
            ...current,
            spendingItems: current.spendingItems.filter((spendingItem) => spendingItem.id !== id),
          };

          persistActiveSession(nextSession);
          return nextSession;
        });
      },
      deleteCompletedSession: (sessionIndex) => {
        setStorageError(null);
        setCompletedSessions((existingSessions) => {
          const deletedSession = existingSessions[sessionIndex] ?? null;
          const nextSessions = existingSessions.filter((_, index) => index !== sessionIndex);
          const nextLatestSession =
            deletedSession &&
            latestCompletedSession?.startedAt === deletedSession.startedAt &&
            latestCompletedSession?.endedAt === deletedSession.endedAt
              ? (nextSessions[0] ?? null)
              : latestCompletedSession;

          setLatestCompletedSession(nextLatestSession);
          persistLatestCompletedSession(nextLatestSession);
          persistCompletedSessions(nextSessions);

          return nextSessions;
        });
      },
      clearCompletedSessions: () => {
        setStorageError(null);
        setCompletedSessions([]);
        setLatestCompletedSession(null);
        persistCompletedSessions([]);
        persistLatestCompletedSession(null);
      },
      endSession: () => {
        setSession((current) => {
          if (!current || current.endedAt) {
            return current;
          }

          const nextSession = {
            ...current,
            endedAt: Date.now(),
            notificationIds: null,
          };

          setLatestCompletedSession(nextSession);
          persistLatestCompletedSession(nextSession);
          setCompletedSessions((existingSessions) => {
            const nextSessions = [nextSession, ...existingSessions];
            persistCompletedSessions(nextSessions);
            return nextSessions;
          });
          void cancelSessionReminders(current.notificationIds);
          void cancelAllDimSessionReminders();
          persistActiveSession(null);

          return null;
        });
      },
    }),
    [
      completedSessions,
      isRestoring,
      latestCompletedSession,
      reminderPermissionStatus,
      session,
      settings.goHomePhoneNotifications,
      settings.goHomeReminderSound,
      settings.goHomeReminderVibrate,
      settings.intervalReminderSound,
      settings.intervalReminderVibrate,
      settings.nextDrinkPhoneNotifications,
      storageError,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function withDefaultSessionFields(session: DrinkingSession): DrinkingSession {
  const legacyIntervalMinutes = session.intervalMinutes ?? 60;
  const drinkCount = session.drinkCount ?? 0;
  const drinkLogs =
    session.drinkLogs ??
    Array.from({ length: drinkCount }, (_, index) => ({
      id: `legacy-${session.startedAt}-${index}`,
      intervalMinutes: legacyIntervalMinutes,
      loggedAt: session.startedAt ?? 0,
    }));

  return {
    ...session,
    intervalMinutes: legacyIntervalMinutes,
    behavioralReminders: session.behavioralReminders ?? {
      foodEnabled: false,
      foodTriggered: false,
      goHomeEnabled: false,
      goHomeTriggered: false,
    },
    drinkCount,
    drinkLogs,
    endedAt: session.endedAt ?? null,
    maxDrinks: session.maxDrinks ?? Math.max(1, drinkCount),
    nextAllowedDrinkAt: session.nextAllowedDrinkAt ?? null,
    notificationIds: session.notificationIds ?? null,
    pacing: session.pacing ?? {
      intervalMinutes: legacyIntervalMinutes,
      type: "fixed",
    },
    presetName: session.presetName ?? null,
    primaryDrinkType: session.primaryDrinkType ?? "Mixed",
    spendingCap: session.spendingCap ?? null,
    spendingItems: session.spendingItems ?? [],
    startedAt: session.startedAt ?? 0,
  };
}

function getBehavioralReminderStateAfterDrink(
  session: DrinkingSession,
  nextDrinkCount: number,
): BehavioralReminderState {
  const halfwayDrinkCount = Math.ceil(session.maxDrinks / 2);

  return {
    ...session.behavioralReminders,
    foodTriggered:
      session.behavioralReminders.foodTriggered ||
      (session.behavioralReminders.foodEnabled && nextDrinkCount >= halfwayDrinkCount),
    goHomeTriggered:
      session.behavioralReminders.goHomeTriggered ||
      (session.behavioralReminders.goHomeEnabled && nextDrinkCount >= session.maxDrinks),
  };
}

async function sendTriggeredBehavioralReminders(
  previousSession: DrinkingSession,
  nextSession: DrinkingSession,
  isGoHomePhoneNotificationEnabled: boolean,
  goHomeReminderSound: ReminderSoundSetting,
  isGoHomeReminderVibrateEnabled: boolean,
) {
  if (
    !previousSession.behavioralReminders.goHomeTriggered &&
    nextSession.behavioralReminders.goHomeTriggered
  ) {
    const isHighRiskNight = nextSession.presetName === "High-Risk Night";

    await sendBehavioralReminder({
      body: isHighRiskNight
        ? "This is a guardrail night. Slow down, switch to water, and leave if you can."
        : "You reached the plan you set while sober. Go home with no regrets.",
      isPhoneNotificationEnabled: isGoHomePhoneNotificationEnabled,
      soundSetting: goHomeReminderSound,
      title: isHighRiskNight ? "Create an exit" : "Time to wrap up",
      type: "go-home",
      vibrate: isGoHomeReminderVibrateEnabled,
    });
  }
}

function parseSession(value: string): DrinkingSession {
  return withDefaultSessionFields(JSON.parse(value) as DrinkingSession);
}

function parseSessions(value: string): DrinkingSession[] {
  return (JSON.parse(value) as DrinkingSession[]).map(withDefaultSessionFields);
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return value;
}
