import type { PacingConfig, PrimaryDrinkType, SessionPresetName } from "../context/session";

export type SessionPreset = {
  name: SessionPresetName;
  useCase: string;
  behavioralReminders: {
    food: boolean;
    goHome: boolean;
  };
  maxDrinks: number;
  spendingCap: number | null;
  pacing: PacingConfig;
  guidance: string;
  note?: string;
};

export const primaryDrinkTypes: PrimaryDrinkType[] = [
  "Beer",
  "Wine",
  "Spirits / liquor",
  "Cocktails",
  "Mixed",
  "Non-alcoholic / tracking only",
];

export const sessionPresets: SessionPreset[] = [
  {
    name: "Solo / Home",
    useCase: "A low-risk home session.",
    maxDrinks: 3,
    behavioralReminders: {
      food: false,
      goHome: false,
    },
    spendingCap: null,
    pacing: {
      intervalMinutes: 60,
      type: "fixed",
    },
    guidance: "Easy night. Keep it simple.",
  },
  {
    name: "Drinks @Home w/ Company",
    useCase: "Friends are over and the night may run long.",
    maxDrinks: 6,
    behavioralReminders: {
      food: false,
      goHome: false,
    },
    spendingCap: null,
    pacing: {
      firstIntervalMinutes: 60,
      laterIntervalMinutes: 90,
      switchAfterDrink: 3,
      type: "dynamic",
    },
    guidance: "Good company can stretch the night. Let the app handle the pacing.",
  },
  {
    name: "Night Out",
    useCase: "A social night where spending, food, and getting home matter.",
    maxDrinks: 6,
    behavioralReminders: {
      food: true,
      goHome: true,
    },
    spendingCap: 3000,
    pacing: {
      firstIntervalMinutes: 60,
      laterIntervalMinutes: 90,
      switchAfterDrink: 3,
      type: "dynamic",
    },
    guidance: "Pace the night. Eat halfway. Go home when the plan is done.",
    note: "Spending and food matter tonight. Set a cap, eat halfway, and go home when the plan is done.",
  },
  {
    name: "High-Risk Night",
    useCase: "Hard liquor, volatile company, or outside your comfort zone.",
    maxDrinks: 3,
    behavioralReminders: {
      food: false,
      goHome: true,
    },
    spendingCap: 2000,
    pacing: {
      intervalMinutes: 90,
      type: "fixed",
    },
    guidance: "This is a guardrail night. Slow down and create an exit.",
    note: "This preset is for nights where you want stronger guardrails. The goal is to get home with no regrets.",
  },
];
