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
      <View style={styles.backgroundGlow} />
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
  value: string;
};

export function StatCard({ action, icon, label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
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

  return (
    <View style={[styles.reminderCard, isFinal ? styles.reminderCardFinal : null]}>
      <View style={styles.reminderIcon}>
        <Text style={styles.reminderIconText}>{isFinal ? "!" : "*"}</Text>
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
  backgroundGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(212, 148, 25, 0.12)",
  },
  heroCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    ...shadows.soft,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  statIcon: {
    alignItems: "center",
    width: 52,
    height: 52,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.wine,
  },
  statText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  statValue: {
    color: colors.wineDeep,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
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
  },
  reminderCardFinal: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
  },
  reminderIcon: {
    alignItems: "center",
    width: 58,
    height: 58,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.wine,
    borderColor: colors.accent,
    borderWidth: 2,
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
