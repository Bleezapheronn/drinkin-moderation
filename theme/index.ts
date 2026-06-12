import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  accent: "#c98212",
  accentDark: "#9b6109",
  accentLight: "#f0c46f",
  accentSoft: "#fff3d8",
  border: "#ead6aa",
  borderStrong: "#d49419",
  card: "#fffaf0",
  cardMuted: "#fff5e3",
  destructive: "#9f3f42",
  destructiveSoft: "#f8e4df",
  ink: "#2b2526",
  muted: "#5e5554",
  mutedLight: "#8a7a76",
  overlay: "rgba(43, 11, 20, 0.48)",
  success: "#2f6f62",
  successSoft: "#e5f0ea",
  warning: "#8a5304",
  warningSoft: "#fff1cf",
  white: "#ffffff",
  wine: "#520019",
  wineDeep: "#2c0710",
  wineSoft: "#8c0f2c",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadows = {
  soft: {
    elevation: 3,
    shadowColor: colors.wineDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  } satisfies ViewStyle,
  gold: {
    elevation: 4,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  } satisfies ViewStyle,
};

export const typography = {
  screenTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  } satisfies TextStyle,
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 23,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  } satisfies TextStyle,
  numericTimer: {
    fontSize: 70,
    fontWeight: "900",
    lineHeight: 78,
  } satisfies TextStyle,
  buttonLabel: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  } satisfies TextStyle,
};

export const theme = {
  colors,
  radius,
  shadows,
  spacing,
  typography,
};
