import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  accent: "#c98608",
  accentDark: "#8f5706",
  accentDeep: "#a46306",
  accentLight: "#f3c96d",
  accentMid: "#df9f1d",
  accentSoft: "#fff1d1",
  border: "#eed8aa",
  borderStrong: "#d69a18",
  card: "#fff8eb",
  cardMuted: "#fff1dc",
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
  wine: "#5b001b",
  wineDark: "#3b0010",
  wineDeep: "#2f0612",
  wineGlow: "#7f122d",
  wineSoft: "#8a102c",
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
    elevation: 5,
    shadowColor: colors.wineDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  } satisfies ViewStyle,
  card: {
    elevation: 7,
    shadowColor: colors.wineDeep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
  } satisfies ViewStyle,
  gold: {
    elevation: 5,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  } satisfies ViewStyle,
};

export const typography = {
  screenTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  } satisfies TextStyle,
  heroTitle: {
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 44,
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
    fontSize: 76,
    fontWeight: "900",
    lineHeight: 82,
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
