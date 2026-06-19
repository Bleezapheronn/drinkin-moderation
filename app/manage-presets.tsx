import { Stack, router } from "expo-router";
import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen, PrimaryButton } from "../components/design-system";
import { usePresets } from "../context/presets";
import { colors, fontFamilies, radius, shadows, spacing, typography } from "../theme";
import { getPacingSummary } from "../utils/pacing";
import { BuiltInPresetId, isBuiltInPresetId, SessionPreset } from "../utils/session-presets";

export default function ManagePresetsScreen() {
  const {
    builtInPresets,
    customPresets,
    deleteCustomPreset,
    hasBuiltInOverride,
    isRestoringPresets,
    presetsError,
    resetBuiltInPreset,
  } = usePresets();

  const confirmResetBuiltInPreset = (presetId: BuiltInPresetId, presetName: string) => {
    Alert.alert("Reset preset", `Reset ${presetName} to its built-in defaults?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => resetBuiltInPreset(presetId),
      },
    ]);
  };

  const confirmDeleteCustomPreset = (preset: SessionPreset) => {
    Alert.alert("Delete preset", `Delete ${preset.name}? This will not change existing sessions.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteCustomPreset(preset.id),
        style: "destructive",
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.wine },
          headerStyle: { backgroundColor: colors.wine },
          headerTintColor: colors.card,
          headerTitleStyle: { color: colors.card, fontFamily: fontFamilies.cardTitle },
          title: "Presets",
        }}
      />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Templates</Text>
            <Text style={styles.title}>Manage Presets</Text>
            <Text style={styles.body}>Tune built-ins or save your own starting points.</Text>
          </View>

          {isRestoringPresets ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Loading saved presets.</Text>
            </View>
          ) : null}

          {presetsError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{presetsError}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built-in presets</Text>
            {builtInPresets.map((preset) => {
              const canReset = hasBuiltInOverride(preset.id);
              const builtInPresetId = isBuiltInPresetId(preset.id) ? preset.id : null;

              return (
                <PresetCard key={preset.id} preset={preset}>
                  <View style={styles.actionRow}>
                    <SmallButton
                      label="Edit"
                      onPress={() =>
                        router.push({
                          pathname: "/preset-editor",
                          params: { mode: "edit-built-in", presetId: preset.id },
                        } as unknown as Href)
                      }
                    />
                    {canReset && builtInPresetId ? (
                      <SmallButton
                        label="Reset"
                        onPress={() => confirmResetBuiltInPreset(builtInPresetId, preset.name)}
                        variant="danger"
                      />
                    ) : null}
                  </View>
                </PresetCard>
              );
            })}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Custom presets</Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/preset-editor",
                    params: { mode: "create-custom" },
                  } as unknown as Href)
                }
                style={styles.inlineButton}
              >
                <Text style={styles.inlineButtonText}>Create</Text>
              </Pressable>
            </View>
            {customPresets.length > 0 ? (
              customPresets.map((preset) => (
                <PresetCard key={preset.id} preset={preset}>
                  <View style={styles.actionRow}>
                    <SmallButton
                      label="Edit"
                      onPress={() =>
                        router.push({
                          pathname: "/preset-editor",
                          params: { mode: "edit-custom", presetId: preset.id },
                        } as unknown as Href)
                      }
                    />
                    <SmallButton
                      label="Delete"
                      onPress={() => confirmDeleteCustomPreset(preset)}
                      variant="danger"
                    />
                  </View>
                </PresetCard>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.cardBody}>No custom presets yet.</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            onPress={() =>
              router.push({
                pathname: "/preset-editor",
                params: { mode: "create-custom" },
              } as unknown as Href)
            }
          >
            Create preset
          </PrimaryButton>
        </ScrollView>
      </AppScreen>
    </>
  );
}

type PresetCardProps = {
  children: ReactNode;
  preset: SessionPreset;
};

function PresetCard({ children, preset }: PresetCardProps) {
  const reminderCopy = [
    preset.behavioralReminders.food ? "food" : null,
    preset.behavioralReminders.goHome ? "go-home" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.presetCard}>
      <View style={styles.presetCopy}>
        <Text style={styles.presetName}>{preset.name}</Text>
        <Text style={styles.cardBody}>{preset.useCase}</Text>
        <Text style={styles.presetDetail}>
          {preset.maxDrinks} max drinks · {getPacingSummary(preset.pacing)}
        </Text>
        <Text style={styles.presetDetail}>
          {preset.primaryDrinkType}
          {preset.spendingCap === null ? "" : ` · cap ${preset.spendingCap}`}
          {reminderCopy ? ` · ${reminderCopy}` : ""}
        </Text>
      </View>
      {children}
    </View>
  );
}

type SmallButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "default" | "danger";
};

function SmallButton({ label, onPress, variant = "default" }: SmallButtonProps) {
  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.smallButton, isDanger ? styles.smallButtonDanger : null]}
    >
      <Text style={[styles.smallButtonText, isDanger ? styles.smallButtonTextDanger : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.accentLight,
    textTransform: "uppercase",
    ...typography.caption,
  },
  title: {
    color: colors.card,
    ...typography.screenTitle,
  },
  body: {
    color: colors.cardMuted,
    ...typography.body,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.card,
    ...typography.sectionTitle,
  },
  presetCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.soft,
  },
  presetCopy: {
    gap: spacing.xs,
  },
  presetName: {
    color: colors.wineDeep,
    fontFamily: fontFamilies.cardTitle,
    fontSize: 19,
    lineHeight: 25,
  },
  cardBody: {
    color: colors.muted,
    ...typography.body,
  },
  presetDetail: {
    color: colors.accentDark,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  smallButton: {
    borderRadius: radius.md,
    backgroundColor: colors.wine,
    borderColor: colors.accent,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  smallButtonDanger: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
  },
  smallButtonText: {
    color: colors.accentLight,
    fontFamily: fontFamilies.button,
    fontSize: 14,
    lineHeight: 20,
  },
  smallButtonTextDanger: {
    color: colors.destructive,
  },
  inlineButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineButtonText: {
    color: colors.white,
    fontFamily: fontFamilies.button,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  notice: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
  },
  noticeText: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 21,
  },
});
