import type { ReactNode } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";

type AppScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppScreen({ children, style }: AppScreenProps) {
  return (
    <View style={[styles.appScreen, style]}>
      <View style={styles.topWash} />
      <View style={styles.backgroundGlow} />
      <View style={styles.lowerGlow} />
      {children}
    </View>
  );
}

type HeroCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroCard({ children, style }: HeroCardProps) {
  return <View style={[styles.heroCard, style]}>{children}</View>;
}

type StatCardProps = {
  action?: ReactNode;
  icon?: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export function StatCard({ action, icon, label, style, value }: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      {icon ? <View style={styles.statIcon}>{icon}</View> : null}
      <View style={styles.statText}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
          {value}
        </Text>
        <Text numberOfLines={1} style={styles.statLabel}>
          {label}
        </Text>
      </View>
      {action ? <View style={styles.statAction}>{action}</View> : null}
    </View>
  );
}

type PrimaryButtonProps = PressableProps & {
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PrimaryButton({
  children,
  disabled = false,
  style,
  textStyle,
  ...pressableProps
}: PrimaryButtonProps) {
  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      style={[styles.primaryButton, disabled ? styles.primaryButtonDisabled : null, style]}
    >
      <Text style={[styles.primaryButtonText, disabled ? styles.primaryButtonTextDisabled : null, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

type InfoStripProps = {
  children: ReactNode;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function InfoStrip({ children, icon, style }: InfoStripProps) {
  return (
    <View style={[styles.infoStrip, style]}>
      {icon ? <View style={styles.infoIcon}>{icon}</View> : null}
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

type ReminderCardProps = {
  body: string;
  level?: "standard" | "strong" | "final";
  onDismiss?: () => void;
  title: string;
};

export function ReminderCard({ body, level = "standard", onDismiss, title }: ReminderCardProps) {
  const isFinal = level === "final";
  const isStrong = level === "strong";

  return (
    <View
      style={[
        styles.reminderCard,
        isStrong ? styles.reminderCardStrong : null,
        isFinal ? styles.reminderCardFinal : null,
      ]}
    >
      <View
        style={[
          styles.reminderIcon,
          isStrong ? styles.reminderIconStrong : null,
          isFinal ? styles.reminderIconFinal : null,
        ]}
      >
        <Text style={styles.reminderIconText}>{isFinal ? "!" : isStrong ? "*" : "i"}</Text>
      </View>
      <View style={styles.reminderCopy}>
        <View style={styles.reminderHeader}>
          <Text style={styles.reminderTitle}>{title}</Text>
          {onDismiss ? (
            <Pressable accessibilityLabel={`Dismiss ${title}`} onPress={onDismiss} hitSlop={8}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.reminderBody}>{body}</Text>
      </View>
      <Text style={styles.reminderWatermark}>OMD</Text>
    </View>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
};

export function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appScreen: {
    flex: 1,
    backgroundColor: colors.wine,
  },
  topWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: "rgba(255, 244, 214, 0.04)",
  },
  backgroundGlow: {
    position: "absolute",
    top: -76,
    right: -92,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(214, 154, 24, 0.16)",
  },
  lowerGlow: {
    position: "absolute",
    top: 210,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(47, 6, 18, 0.34)",
  },
  heroCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    ...shadows.card,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 88,
    paddingHorizontal: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  statIcon: {
    alignItems: "center",
    width: 36,
    height: 36,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.wine,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  statText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  statValue: {
    color: colors.wineDeep,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  statAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 58,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.gold,
  },
  primaryButtonDisabled: {
    backgroundColor: "#d8c8a6",
    borderColor: "#d8c8a6",
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: colors.white,
    textAlign: "center",
    ...typography.buttonLabel,
  },
  primaryButtonTextDisabled: {
    color: "#6b6259",
  },
  infoStrip: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  infoIcon: {
    alignItems: "center",
    width: 34,
    height: 34,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  reminderCard: {
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    ...shadows.soft,
  },
  reminderCardStrong: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.borderStrong,
  },
  reminderCardFinal: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
  },
  reminderIcon: {
    alignItems: "center",
    width: 54,
    height: 54,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.wine,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  reminderIconStrong: {
    backgroundColor: colors.wine,
  },
  reminderIconFinal: {
    backgroundColor: colors.destructive,
    borderColor: colors.wineDeep,
  },
  reminderIconText: {
    color: colors.accentLight,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },
  reminderCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  reminderHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  reminderTitle: {
    flex: 1,
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  reminderBody: {
    color: colors.ink,
    ...typography.body,
  },
  dismissText: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: "900",
  },
  reminderWatermark: {
    position: "absolute",
    right: 18,
    bottom: 10,
    color: "rgba(201, 130, 18, 0.12)",
    fontSize: 34,
    fontWeight: "900",
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accentLight,
    textTransform: "uppercase",
    ...typography.caption,
  },
  sectionTitle: {
    color: colors.card,
    ...typography.screenTitle,
  },
});
