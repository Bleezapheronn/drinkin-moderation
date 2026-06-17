import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
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

import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";

type AppScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppScreen({ children, style }: AppScreenProps) {
  return (
    <LinearGradient
      colors={[colors.wineDark, colors.wine, colors.wineDeep]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.appScreen, style]}
    >
      <LinearGradient
        colors={["rgba(255, 229, 167, 0.16)", "rgba(255, 229, 167, 0)"]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.topHighlight}
      />
      <View style={styles.topWash} />
      <View style={styles.backgroundGlow} />
      <View style={styles.lowerGlow} />
      <View style={styles.sideWineShape} />
      {children}
    </LinearGradient>
  );
}

type HeroCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroCard({ children, style }: HeroCardProps) {
  return (
    <View style={[styles.heroCardShell, style]}>
      <LinearGradient
        colors={["#fffdf6", colors.card, "#fff1dc"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.heroCard}
      >
        <View style={styles.heroInnerGlow} />
        {children}
      </LinearGradient>
    </View>
  );
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
      {disabled ? null : (
        <LinearGradient
          colors={[colors.accentLight, colors.accentMid, colors.accentDeep]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.primaryButtonShine} />
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
      <View pointerEvents="none" style={styles.skyline}>
        <View style={[styles.skylineBuilding, styles.skylineLow]} />
        <View style={[styles.skylineBuilding, styles.skylineMid]} />
        <View style={[styles.skylineBuilding, styles.skylineTall]} />
        <View style={[styles.skylineBuilding, styles.skylineMid]} />
        <View style={[styles.skylineBuilding, styles.skylineLow]} />
        <Text style={styles.skylineMoon}>◦</Text>
      </View>
    </View>
  );
}

type ReminderCardProps = {
  body: string;
  icon?: ReminderIconName;
  level?: "standard" | "strong" | "final";
  onDismiss?: () => void;
  title: string;
};

export type ReminderIconName = "alert" | "food" | "info" | "star" | "water";

export function ReminderCard({
  body,
  icon,
  level = "standard",
  onDismiss,
  title,
}: ReminderCardProps) {
  const isFinal = level === "final";
  const isStrong = level === "strong";
  const reminderIcon = icon ?? (isFinal ? "alert" : isStrong ? "star" : "info");

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
        <ReminderGlyph icon={reminderIcon} />
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
      <View pointerEvents="none" style={styles.reminderWatermark}>
        <View style={styles.watermarkMugBody}>
          <View style={styles.watermarkMugShine} />
          <View style={styles.watermarkMugFoam} />
        </View>
        <View style={styles.watermarkMugHandle} />
      </View>
    </View>
  );
}

function ReminderGlyph({ icon }: { icon: ReminderIconName }) {
  if (icon === "water") {
    return (
      <View style={styles.waterGlyph}>
        <View style={styles.waterGlyphHighlight} />
      </View>
    );
  }

  if (icon === "food") {
    return (
      <View style={styles.utensilsGlyph}>
        <View style={styles.forkHandle} />
        <View style={styles.forkTines}>
          <View style={styles.forkTine} />
          <View style={styles.forkTine} />
          <View style={styles.forkTine} />
        </View>
        <View style={styles.knifeGlyph} />
      </View>
    );
  }

  const iconCopy = icon === "alert" ? "!" : icon === "star" ? "☆" : "i";

  return <Text style={styles.reminderIconText}>{iconCopy}</Text>;
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
    backgroundColor: "rgba(255, 244, 214, 0.035)",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  backgroundGlow: {
    position: "absolute",
    top: 26,
    right: -118,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(214, 154, 24, 0.18)",
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
  sideWineShape: {
    position: "absolute",
    top: 70,
    right: -92,
    width: 190,
    height: 330,
    borderRadius: 110,
    backgroundColor: "rgba(127, 18, 45, 0.28)",
    transform: [{ rotate: "18deg" }],
  },
  heroCardShell: {
    borderRadius: radius.xl,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    overflow: "hidden",
    ...shadows.card,
  },
  heroCard: {
    gap: spacing.lg,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  heroInnerGlow: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(243, 201, 109, 0.13)",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 82,
    paddingHorizontal: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  statIcon: {
    alignItems: "center",
    width: 40,
    height: 40,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.wine,
    borderColor: colors.accentMid,
    borderWidth: 1.5,
  },
  statText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statValue: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 12,
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
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    overflow: "hidden",
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
    zIndex: 2,
    ...typography.buttonLabel,
  },
  primaryButtonShine: {
    position: "absolute",
    top: 1,
    left: 12,
    right: 12,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    zIndex: 1,
  },
  primaryButtonTextDisabled: {
    color: "#6b6259",
  },
  infoStrip: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "#fff9ee",
    borderColor: colors.borderStrong,
    borderWidth: 1.25,
    ...shadows.soft,
  },
  infoIcon: {
    alignItems: "center",
    width: 30,
    height: 30,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderColor: colors.accent,
    borderWidth: 1,
    zIndex: 2,
  },
  infoText: {
    flex: 1,
    color: colors.ink,
    zIndex: 2,
    ...typography.bodyBold,
  },
  skyline: {
    position: "absolute",
    right: 18,
    bottom: 7,
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    opacity: 0.32,
  },
  skylineBuilding: {
    width: 7,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: colors.accentLight,
  },
  skylineLow: {
    height: 13,
  },
  skylineMid: {
    height: 18,
  },
  skylineTall: {
    height: 26,
  },
  skylineMoon: {
    position: "absolute",
    right: -14,
    top: -13,
    color: colors.accent,
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 26,
  },
  reminderCard: {
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#fff5df",
    borderColor: colors.accentMid,
    borderWidth: 1.5,
    ...shadows.soft,
  },
  reminderCardStrong: {
    backgroundColor: "#fff1cf",
    borderColor: colors.accent,
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
    borderColor: colors.accentMid,
    borderWidth: 1.5,
  },
  reminderIconStrong: {
    backgroundColor: colors.wine,
  },
  reminderIconFinal: {
    backgroundColor: colors.wine,
    borderColor: colors.accentMid,
  },
  reminderIconText: {
    color: colors.accentLight,
    fontFamily: fontFamilies.button,
    fontSize: 34,
    lineHeight: 38,
  },
  waterGlyph: {
    width: 23,
    height: 29,
    borderRadius: 14,
    borderTopLeftRadius: 18,
    backgroundColor: colors.accentLight,
    transform: [{ rotate: "45deg" }],
  },
  waterGlyphHighlight: {
    position: "absolute",
    top: 7,
    left: 6,
    width: 5,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 248, 235, 0.46)",
  },
  utensilsGlyph: {
    width: 34,
    height: 34,
  },
  forkHandle: {
    position: "absolute",
    left: 8,
    bottom: 3,
    width: 4,
    height: 23,
    borderRadius: radius.pill,
    backgroundColor: colors.accentLight,
  },
  forkTines: {
    position: "absolute",
    top: 3,
    left: 4,
    flexDirection: "row",
    gap: 2,
  },
  forkTine: {
    width: 3,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accentLight,
  },
  knifeGlyph: {
    position: "absolute",
    right: 6,
    top: 3,
    width: 8,
    height: 29,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 8,
    backgroundColor: colors.accentLight,
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
    fontFamily: fontFamilies.button,
    fontSize: 13,
    lineHeight: 18,
  },
  reminderWatermark: {
    position: "absolute",
    right: 22,
    bottom: 14,
    width: 76,
    height: 62,
    opacity: 0.13,
  },
  watermarkMugBody: {
    position: "absolute",
    left: 3,
    bottom: 0,
    width: 48,
    height: 54,
    borderColor: colors.accent,
    borderWidth: 3,
    borderRadius: 8,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },
  watermarkMugShine: {
    position: "absolute",
    top: 11,
    left: 12,
    width: 3,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  watermarkMugFoam: {
    position: "absolute",
    top: -9,
    left: 4,
    width: 38,
    height: 15,
    borderRadius: radius.pill,
    borderColor: colors.accent,
    borderWidth: 3,
    backgroundColor: colors.card,
  },
  watermarkMugHandle: {
    position: "absolute",
    right: 0,
    bottom: 15,
    width: 29,
    height: 31,
    borderColor: colors.accent,
    borderWidth: 3,
    borderRadius: radius.pill,
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
