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

export const fontFamilies = {
  display: "Fraunces_900Black",
  heading: "Fraunces_800ExtraBold",
  cardTitle: "Fraunces_700Bold",
  timer: "Fraunces_900Black",
  body: "NunitoSans_400Regular",
  bodyMedium: "NunitoSans_600SemiBold",
  bodyBold: "NunitoSans_800ExtraBold",
  button: "NunitoSans_900Black",
};

export const typography = {
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 38,
    lineHeight: 44,
  } satisfies TextStyle,
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: 30,
    lineHeight: 36,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily: fontFamilies.cardTitle,
    fontSize: 20,
    lineHeight: 26,
  } satisfies TextStyle,
  timer: {
    fontFamily: fontFamilies.timer,
    fontSize: 76,
    lineHeight: 82,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 23,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 16,
    lineHeight: 23,
  } satisfies TextStyle,
  bodyBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
    lineHeight: 23,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamilies.button,
    fontSize: 17,
    lineHeight: 22,
  } satisfies TextStyle,
  screenTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 30,
    lineHeight: 36,
  } satisfies TextStyle,
  heroTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 38,
    lineHeight: 44,
  } satisfies TextStyle,
  sectionTitle: {
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  } satisfies TextStyle,
  numericTimer: {
    fontFamily: fontFamilies.timer,
    fontSize: 76,
    lineHeight: 82,
  } satisfies TextStyle,
  buttonLabel: {
    fontFamily: fontFamilies.button,
    fontSize: 17,
    lineHeight: 22,
  } satisfies TextStyle,
};

export const theme = {
  colors,
  fontFamilies,
  radius,
  shadows,
  spacing,
  typography,
};
