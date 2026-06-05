import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

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

export type DrinkingSession = SessionConfig & {
  drinkCount: number;
  startedAt: number;
  endedAt: number | null;
  nextAllowedDrinkAt: number | null;
  spendingItems: SpendingItem[];
};

type SessionContextValue = {
  session: DrinkingSession | null;
  completedSessions: DrinkingSession[];
  latestCompletedSession: DrinkingSession | null;
  isRestoring: boolean;
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
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSessions() {
      try {
        const [activeValue, completedValue, latestValue] = await Promise.all([
          AsyncStorage.getItem(activeSessionKey),
          AsyncStorage.getItem(completedSessionsKey),
          AsyncStorage.getItem(latestCompletedSessionKey),
        ]);

        setSession(activeValue ? parseSession(activeValue) : null);
        setCompletedSessions(completedValue ? parseSessions(completedValue) : []);
        setLatestCompletedSession(latestValue ? parseSession(latestValue) : null);
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

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      completedSessions,
      latestCompletedSession,
      isRestoring,
      storageError,
      startSession: (config) => {
        const nextSession = {
          ...config,
          drinkCount: 0,
          startedAt: Date.now(),
          endedAt: null,
          nextAllowedDrinkAt: null,
          spendingItems: [],
        };

        setStorageError(null);
        setSession(nextSession);
        persistActiveSession(nextSession);
      },
      logDrink: () => {
        setSession((current) => {
          if (!current || current.endedAt || current.drinkCount >= current.maxDrinks) {
            return current;
          }

          const drinkCount = current.drinkCount + 1;

          const nextSession = {
            ...current,
            drinkCount,
            nextAllowedDrinkAt: Date.now() + current.intervalMinutes * 60 * 1000,
          };

          persistActiveSession(nextSession);
          return nextSession;
        });
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
          };

          setLatestCompletedSession(nextSession);
          persistLatestCompletedSession(nextSession);
          setCompletedSessions((existingSessions) => {
            const nextSessions = [nextSession, ...existingSessions];
            persistCompletedSessions(nextSessions);
            return nextSessions;
          });
          persistActiveSession(null);

          return null;
        });
      },
    }),
    [completedSessions, isRestoring, latestCompletedSession, session, storageError],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function parseSession(value: string): DrinkingSession {
  return JSON.parse(value) as DrinkingSession;
}

function parseSessions(value: string): DrinkingSession[] {
  return JSON.parse(value) as DrinkingSession[];
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return value;
}
