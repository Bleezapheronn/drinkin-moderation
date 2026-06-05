import type { DrinkingSession, PacingConfig } from "../context/session";

export function getIntervalForNextDrink(session: DrinkingSession) {
  return getIntervalForDrinkCount(session.pacing, session.drinkCount + 1);
}

export function getIntervalForDrinkCount(pacing: PacingConfig, drinkNumber: number) {
  if (pacing.type === "fixed") {
    return pacing.intervalMinutes;
  }

  return drinkNumber <= pacing.switchAfterDrink
    ? pacing.firstIntervalMinutes
    : pacing.laterIntervalMinutes;
}

export function getPacingSummary(pacing: PacingConfig) {
  if (pacing.type === "fixed") {
    return `Fixed interval: ${pacing.intervalMinutes} min`;
  }

  return `First ${pacing.switchAfterDrink} drinks: ${pacing.firstIntervalMinutes} min. After that: ${pacing.laterIntervalMinutes} min.`;
}
