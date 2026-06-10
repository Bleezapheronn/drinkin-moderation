import type { DrinkingSession } from "../context/session";
import type { CurrencyCode } from "../context/settings";
import { formatCurrency } from "./currency";
import {
  getTotalSpent,
  stayedWithinDrinkPlan,
  stayedWithinSpendingPlan,
} from "./session-metrics";
import { getDrinkingActivityRange } from "./session-timing";

export function getSessionTitle(session: DrinkingSession) {
  return session.presetName ?? "Custom session";
}

export function getSessionDateRange(session: DrinkingSession) {
  const activityRange = getDrinkingActivityRange(session);
  const date = formatDate(activityRange.startedAt);
  const startTime = formatTime(activityRange.startedAt);
  const endTime = activityRange.endedAt ? formatTime(activityRange.endedAt) : null;

  if (date === "Not recorded" || startTime === "Not recorded") {
    return "Not recorded";
  }

  return endTime ? `${date} · ${startTime} - ${endTime}` : `${date} · ${startTime}`;
}

export function getSessionSummaryLine(session: DrinkingSession, currency: CurrencyCode = "KES") {
  const totalSpent = getTotalSpent(session);
  const hasSpending = session.spendingCap !== null || session.spendingItems.length > 0;
  const resultParts = [
    `${session.drinkCount} ${session.drinkCount === 1 ? "drink" : "drinks"}`,
    hasSpending ? formatCurrency(totalSpent, currency) : null,
    stayedWithinDrinkPlan(session) ? "Within plan" : "Over drink plan",
    hasSpending
      ? stayedWithinSpendingPlan(session)
        ? "Within spending plan"
        : "Over spending plan"
      : null,
  ].filter((part): part is string => Boolean(part));

  return resultParts.join(" · ");
}

export function formatDate(timestamp: number | null | undefined) {
  const date = getValidDate(timestamp);

  if (!date) {
    return "Not recorded";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timestamp: number | null | undefined) {
  const date = getValidDate(timestamp);

  if (!date) {
    return "Not recorded";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(startedAt: number | null | undefined, endedAt: number | null) {
  if (!startedAt || !endedAt || endedAt < startedAt) {
    return "Unknown duration";
  }

  const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatSessionDuration(session: DrinkingSession) {
  const activityRange = getDrinkingActivityRange(session);

  return formatDuration(activityRange.startedAt, activityRange.endedAt);
}

function getValidDate(timestamp: number | null | undefined) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}
