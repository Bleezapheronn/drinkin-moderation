import { DrinkingSession } from "../context/session";

export function getTotalSpent(session: DrinkingSession) {
  return session.spendingItems.reduce((total, item) => total + item.amount, 0);
}

export function stayedWithinDrinkPlan(session: DrinkingSession) {
  return session.drinkCount <= session.maxDrinks;
}

export function stayedWithinSpendingPlan(session: DrinkingSession) {
  return session.spendingCap === null || getTotalSpent(session) <= session.spendingCap;
}
