import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import {
  cancelAllDimSessionReminders,
  cancelSessionReminders,
  reconcileSessionReminders,
  ReminderPermissionStatus,
  requestReminderPermissions,
  scheduleSessionReminders,
} from "../utils/session-notifications";

export type SessionConfig = {
  intervalMinutes: number;
  maxDrinks: number;
  spendingCap: number | null;
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

export type SessionNotificationIds = {
  nextDrinkReminderId: string;
  waterReminderId: string | null;
};

export type DrinkingSession = SessionConfig & {
  drinkCount: number;
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
  addSpendingItem: (item: Omit<SpendingItem, "id" | "createdAt">) => void;
  endSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const activeSessionKey = "dim.activeSession";
const completedSessionsKey = "dim.completedSessions";
const latestCompletedSessionKey = "dim.latestCompletedSession";

export function SessionProvider({ children }: PropsWithChildren) {
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

  const persistLatestCompletedSession = (nextSession: DrinkingSession) => {
    AsyncStorage.setItem(latestCompletedSessionKey, JSON.stringify(nextSession)).catch(() => {
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
    const result = await scheduleSessionReminders(scheduledSession);

    setReminderPermissionStatus(result.status);
    storeReminderResult(scheduledSession, result.ids);
  };

  const reconcileRestoredSession = async (restoredSession: DrinkingSession) => {
    const result = await reconcileSessionReminders(restoredSession);

    setReminderPermissionStatus(result.status);
    storeReminderResult(restoredSession, result.ids);
  };

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

        const nextSession = {
          ...session,
          drinkCount: session.drinkCount + 1,
          nextAllowedDrinkAt: Date.now() + session.intervalMinutes * 60 * 1000,
          notificationIds: session.notificationIds,
        };

        setSession(nextSession);
        persistActiveSession(nextSession);
        void scheduleAndStoreReminders(nextSession);
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
      storageError,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function withDefaultSessionFields(session: DrinkingSession): DrinkingSession {
  return {
    ...session,
    notificationIds: session.notificationIds ?? null,
    spendingItems: session.spendingItems ?? [],
  };
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
