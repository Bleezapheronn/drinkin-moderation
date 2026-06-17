import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { Stack, router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "../components/design-system";
import { useSettings } from "../context/settings";
import type {
  CurrencyCode,
  DefaultPresetSetting,
  ReminderSoundChoice,
  ReminderSoundSetting,
  WaterReminderPreference,
} from "../context/settings";
import { useSession } from "../context/session";
import { colors, radius, shadows, spacing, typography } from "../theme";
import { scheduleTestReminderSound } from "../utils/session-notifications";

const presetOptions: { label: string; value: DefaultPresetSetting }[] = [
  { label: "None / Ask every time", value: null },
  { label: "Solo / Home", value: "Solo / Home" },
  { label: "Drinks @Home w/ Company", value: "Drinks @Home w/ Company" },
  { label: "Night Out", value: "Night Out" },
  { label: "High-Risk Night", value: "High-Risk Night" },
];

const currencyOptions: { label: string; value: CurrencyCode }[] = [
  { label: "KES", value: "KES" },
  { label: "USD", value: "USD" },
];

const waterReminderOptions: { label: string; value: WaterReminderPreference }[] = [
  { label: "In-app only", value: "in-app" },
  { label: "Off", value: "off" },
];

const reminderSoundOptions: { label: string; value: ReminderSoundChoice }[] = [
  { label: "System default", value: "system" },
  { label: "Silent / vibrate only", value: "silent" },
  { label: "Built-in OMD sound", value: "built-in" },
  { label: "Choose audio file from device", value: "device-file" },
];

export default function SettingsScreen() {
  const { completedSessions, clearCompletedSessions } = useSession();
  const { isRestoringSettings, settings, settingsError, updateSettings } = useSettings();
  const appVersion = Constants.expoConfig?.version ?? "Not recorded";

  const chooseAudioFile = async (settingKey: "goHomeReminderSound" | "intervalReminderSound") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "audio/*",
      });

      if (result.canceled) {
        return;
      }

      const audioFile = result.assets[0];

      if (!audioFile) {
        return;
      }

      updateSettings({
        [settingKey]: {
          choice: "device-file",
          deviceFile: {
            mimeType: audioFile.mimeType ?? null,
            name: audioFile.name,
            size: audioFile.size ?? null,
            uri: audioFile.uri,
          },
        },
      });
    } catch {
      Alert.alert("Audio file not selected", "OMD could not open the audio picker on this device.");
    }
  };

  const testReminderSound = async (
    kind: "go-home" | "interval",
    soundSetting: ReminderSoundSetting,
  ) => {
    const status = await scheduleTestReminderSound(kind, soundSetting);

    if (status === "granted") {
      Alert.alert("Test scheduled", "A local test notification should arrive in a few seconds.");
      return;
    }

    if (status === "denied") {
      Alert.alert("Notifications are off", "Enable notifications to test reminder sounds.");
      return;
    }

    Alert.alert("Test failed", "OMD could not schedule the test notification on this device.");
  };

  const confirmClearCompletedSessions = () => {
    Alert.alert(
      "Delete completed sessions",
      "Delete all completed sessions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete sessions",
          style: "destructive",
          onPress: clearCompletedSessions,
        },
      ],
    );
  };

  return (
    <>
      <BrandedStack />
      <AppScreen>
        <ScrollView contentContainerStyle={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Preferences</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.body}>Keep the defaults practical and easy to change.</Text>
          </View>

          {isRestoringSettings ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Loading saved settings.</Text>
            </View>
          ) : null}

          {settingsError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{settingsError}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Default preset</Text>
            <Text style={styles.cardBody}>Choose the preset New Session should start with.</Text>
            <View style={styles.optionGrid}>
              {presetOptions.map((option) => (
                <OptionButton
                  key={option.label}
                  isSelected={settings.defaultPreset === option.value}
                  label={option.label}
                  onPress={() => updateSettings({ defaultPreset: option.value })}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Currency</Text>
            <View style={styles.optionRow}>
              {currencyOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  isSelected={settings.currency === option.value}
                  label={option.label}
                  onPress={() => updateSettings({ currency: option.value })}
                />
              ))}
            </View>
            <Text style={styles.note}>
              Changing currency only changes display formatting. It does not convert past amounts.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <ToggleRow
              isEnabled={settings.nextDrinkPhoneNotifications}
              label="Next-drink phone notification"
              onPress={() =>
                updateSettings({
                  nextDrinkPhoneNotifications: !settings.nextDrinkPhoneNotifications,
                })
              }
            />
            <ToggleRow
              isEnabled={settings.goHomePhoneNotifications}
              label="Go-home phone notification"
              onPress={() =>
                updateSettings({
                  goHomePhoneNotifications: !settings.goHomePhoneNotifications,
                })
              }
            />
            <View style={styles.field}>
              <Text style={styles.label}>Water reminder</Text>
              <View style={styles.optionRow}>
                {waterReminderOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    isSelected={settings.waterReminder === option.value}
                    label={option.label}
                    onPress={() => updateSettings({ waterReminder: option.value })}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reminder sounds</Text>
            <Text style={styles.cardBody}>
              Device audio file support is experimental. Some Android notification sounds must be
              bundled with the app.
            </Text>
            <ReminderSoundPicker
              label="Interval reminder sound"
              onChooseFile={() => chooseAudioFile("intervalReminderSound")}
              onSelect={(choice) =>
                updateSettings({
                  intervalReminderSound: {
                    ...settings.intervalReminderSound,
                    choice,
                  },
                })
              }
              onTest={() => testReminderSound("interval", settings.intervalReminderSound)}
              setting={settings.intervalReminderSound}
            />
            <ReminderSoundPicker
              label="Go-home reminder sound"
              onChooseFile={() => chooseAudioFile("goHomeReminderSound")}
              onSelect={(choice) =>
                updateSettings({
                  goHomeReminderSound: {
                    ...settings.goHomeReminderSound,
                    choice,
                  },
                })
              }
              onTest={() => testReminderSound("go-home", settings.goHomeReminderSound)}
              setting={settings.goHomeReminderSound}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Data management</Text>
            <Text style={styles.cardBody}>
              This deletes completed session history only. It does not delete an active session.
            </Text>
            <Pressable
              disabled={completedSessions.length === 0}
              onPress={confirmClearCompletedSessions}
              style={[
                styles.deleteButton,
                completedSessions.length === 0 ? styles.disabledButton : null,
              ]}
            >
              <Text
                style={[
                  styles.deleteButtonText,
                  completedSessions.length === 0 ? styles.disabledButtonText : null,
                ]}
              >
                Clear all completed sessions
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Onboarding</Text>
            <Text style={styles.cardBody}>Review the short introduction to OMD again.</Text>
            <Pressable
              onPress={() => {
                updateSettings({ onboardingCompleted: false });
                router.push("/onboarding");
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Show onboarding again</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>App info</Text>
            <InfoRow label="App name" value="One More Drink" />
            <InfoRow label="Short name" value="OMD" />
            <InfoRow label="Tagline" value="Make a sober plan. Stick to it." />
            <InfoRow label="Version" value={appVersion} />
            <Text style={styles.note}>OMD stores your session data locally on this device.</Text>
            <Text style={styles.note}>
              One More Drink is a planning and harm-reduction tool. It is not medical advice. If alcohol is
              causing repeated harm or feels difficult to control, consider speaking with a qualified
              professional.
            </Text>
          </View>
        </ScrollView>
      </AppScreen>
    </>
  );
}

function BrandedStack() {
  return (
    <Stack.Screen
      options={{
        contentStyle: { backgroundColor: colors.wine },
        headerStyle: { backgroundColor: colors.wine },
        headerTintColor: colors.card,
        headerTitleStyle: { color: colors.card, fontWeight: "900" },
        title: "Settings",
      }}
    />
  );
}

type OptionButtonProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

type ReminderSoundPickerProps = {
  label: string;
  onChooseFile: () => void;
  onSelect: (choice: ReminderSoundChoice) => void;
  onTest: () => void;
  setting: ReminderSoundSetting;
};

function ReminderSoundPicker({
  label,
  onChooseFile,
  onSelect,
  onTest,
  setting,
}: ReminderSoundPickerProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {reminderSoundOptions.map((option) => (
          <OptionButton
            key={option.value}
            isSelected={setting.choice === option.value}
            label={option.label}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      {setting.choice === "built-in" ? (
        <Text style={styles.note}>
          Uses the bundled OMD sound in development and preview builds. Expo Go may still use the
          system default.
        </Text>
      ) : null}
      {setting.choice === "device-file" ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.note}>
            Selected device files are saved locally for exploration, but Android notification sounds
            usually need bundled app assets. Notifications will fall back to the system default.
          </Text>
          {setting.deviceFile ? (
            <Text style={styles.fileSummary}>
              {setting.deviceFile.name}
              {setting.deviceFile.size ? ` · ${formatFileSize(setting.deviceFile.size)}` : ""}
              {setting.deviceFile.mimeType ? ` · ${setting.deviceFile.mimeType}` : ""}
            </Text>
          ) : (
            <Text style={styles.note}>No audio file selected yet.</Text>
          )}
          <Pressable onPress={onChooseFile} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Choose audio file</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable onPress={onTest} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Test {label.toLowerCase()}</Text>
      </Pressable>
    </View>
  );
}

function OptionButton({ isSelected, label, onPress }: OptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
    >
      <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ToggleRowProps = {
  isEnabled: boolean;
  label: string;
  onPress: () => void;
};

function ToggleRow({ isEnabled, label, onPress }: ToggleRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.togglePill, isEnabled ? styles.togglePillOn : null]}>
        <Text style={[styles.toggleValue, isEnabled ? styles.toggleValueOn : null]}>
          {isEnabled ? "On" : "Off"}
        </Text>
      </View>
    </Pressable>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} bytes`;
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
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.wineDeep,
    ...typography.sectionTitle,
  },
  cardBody: {
    color: colors.muted,
    ...typography.body,
  },
  field: {
    gap: spacing.sm,
  },
  inlinePanel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  fileSummary: {
    color: colors.wineDeep,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionGrid: {
    gap: spacing.sm,
  },
  optionButton: {
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.wine,
  },
  optionButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  optionButtonTextSelected: {
    color: colors.accentLight,
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    flex: 1,
    color: colors.wineDeep,
    fontSize: 16,
    fontWeight: "800",
  },
  togglePill: {
    minWidth: 58,
    alignItems: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  togglePillOn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  toggleValue: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  toggleValueOn: {
    color: colors.accentDark,
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructive,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  deleteButtonText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.wineDeep,
    fontSize: 16,
    fontWeight: "900",
  },
  disabledButton: {
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    opacity: 0.62,
  },
  disabledButtonText: {
    color: colors.mutedLight,
  },
  infoRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  infoValue: {
    color: colors.wineDeep,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
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
    fontSize: 15,
    lineHeight: 21,
  },
});
