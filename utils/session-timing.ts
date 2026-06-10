import type { DrinkLog, DrinkingSession, PacingConfig } from "../context/session";
import { getIntervalForDrinkCount } from "./pacing";

const minuteInMs = 60 * 1000;

export type DrinkingActivityRange = {
  endedAt: number | null;
  startedAt: number | null;
};

export function getIntervalForDrinkNumber(pacing: PacingConfig, drinkNumber: number) {
  return getIntervalForDrinkCount(pacing, drinkNumber);
}

export function getPlannedSessionDuration(pacing: PacingConfig, maxDrinks: number) {
  const plannedDrinkCount = Math.max(0, Math.floor(maxDrinks));

  return Array.from({ length: plannedDrinkCount }, (_, index) =>
    getSafeIntervalMinutes(pacing, index + 1),
  ).reduce((totalMinutes, intervalMinutes) => totalMinutes + intervalMinutes, 0);
}

export function getEstimatedSessionEnd(session: DrinkingSession, now: number) {
  const validLogs = getValidDrinkLogs(session.drinkLogs);

  if (validLogs.length === 0) {
    return now + getPlannedSessionDuration(session.pacing, session.maxDrinks) * minuteInMs;
  }

  const lastLog = validLogs[validLogs.length - 1];
  const loggedDrinkCount = validLogs.length;
  const intervalAfterLastDrink = getSafeLogIntervalMinutes(
    lastLog,
    session.pacing,
    loggedDrinkCount,
  );
  const remainingDuration = getRemainingPlannedDuration(
    session.pacing,
    loggedDrinkCount,
    session.maxDrinks,
  );

  return lastLog.loggedAt + (intervalAfterLastDrink + remainingDuration) * minuteInMs;
}

export function getDrinkingActivityRange(session: DrinkingSession): DrinkingActivityRange {
  const validLogs = getValidDrinkLogs(session.drinkLogs);

  if (validLogs.length === 0) {
    return {
      endedAt: getValidTimestamp(session.endedAt),
      startedAt: getValidTimestamp(session.startedAt),
    };
  }

  const firstLog = validLogs[0];
  const lastLog = validLogs[validLogs.length - 1];
  const intervalAfterLastDrink = getSafeLogIntervalMinutes(
    lastLog,
    session.pacing,
    validLogs.length,
  );

  return {
    endedAt: lastLog.loggedAt + intervalAfterLastDrink * minuteInMs,
    startedAt: firstLog.loggedAt,
  };
}

export function formatEstimatedEndTime(timestamp: number | null | undefined) {
  const date = getValidDate(timestamp);

  if (!date) {
    return "Estimated end: Not recorded";
  }

  return `Estimated end: ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function getRemainingPlannedDuration(
  pacing: PacingConfig,
  loggedDrinkCount: number,
  maxDrinks: number,
) {
  const remainingDrinkCount = Math.max(0, Math.floor(maxDrinks) - loggedDrinkCount);

  return Array.from({ length: remainingDrinkCount }, (_, index) =>
    getSafeIntervalMinutes(pacing, loggedDrinkCount + index + 1),
  ).reduce((totalMinutes, intervalMinutes) => totalMinutes + intervalMinutes, 0);
}

function getSafeLogIntervalMinutes(
  drinkLog: DrinkLog,
  pacing: PacingConfig,
  drinkNumber: number,
) {
  return isPositiveFiniteNumber(drinkLog.intervalMinutes)
    ? drinkLog.intervalMinutes
    : getSafeIntervalMinutes(pacing, drinkNumber);
}

function getSafeIntervalMinutes(pacing: PacingConfig, drinkNumber: number) {
  const intervalMinutes = getIntervalForDrinkNumber(pacing, drinkNumber);

  return isPositiveFiniteNumber(intervalMinutes) ? intervalMinutes : 0;
}

function getValidDrinkLogs(drinkLogs: DrinkLog[] | null | undefined) {
  return (drinkLogs ?? []).filter((drinkLog) => getValidTimestamp(drinkLog.loggedAt) !== null);
}

function getValidTimestamp(timestamp: number | null | undefined) {
  return getValidDate(timestamp)?.getTime() ?? null;
}

function getValidDate(timestamp: number | null | undefined) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isPositiveFiniteNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}
