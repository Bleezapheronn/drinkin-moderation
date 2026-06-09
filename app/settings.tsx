import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSettings } from "../context/settings";
import type {
  CurrencyCode,
  DefaultPresetSetting,
  ReminderSoundChoice,
  ReminderSoundSetting,
  WaterReminderPreference,
} from "../context/settings";
import { useSession } from "../context/session";
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
  { label: "Built-in DIM sound", value: "built-in" },
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
      Alert.alert("Audio file not selected", "DIM could not open the audio picker on this device.");
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

    Alert.alert("Test failed", "DIM could not schedule the test notification on this device.");
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
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
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
        <Text style={styles.body}>Choose the preset New Session should start with.</Text>
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
        <Text style={styles.body}>
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
        <Text style={styles.body}>
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
        <Text style={styles.body}>Review the short introduction to DIM again.</Text>
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
        <InfoRow label="App name" value="DrinkInModeration" />
        <InfoRow label="Short name" value="DIM" />
        <InfoRow label="Tagline" value="Make a sober plan. Keep it." />
        <InfoRow label="Version" value={appVersion} />
        <Text style={styles.note}>DIM stores your session data locally on this device.</Text>
        <Text style={styles.note}>
          DIM is a planning and harm-reduction tool. It is not medical advice. If alcohol is
          causing repeated harm or feels difficult to control, consider speaking with a qualified
          professional.
        </Text>
      </View>
    </ScrollView>
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
          Uses the bundled DIM sound in development and preview builds. Expo Go may still use the
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
      <Text style={[styles.toggleValue, isEnabled ? styles.toggleValueOn : null]}>
        {isEnabled ? "On" : "Off"}
      </Text>
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
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#1f2a2e",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  sectionTitle: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "800",
  },
  field: {
    gap: 8,
  },
  inlinePanel: {
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f7f4ef",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  label: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "700",
  },
  fileSummary: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionGrid: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 8,
    borderColor: "#cfc6ba",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButtonSelected: {
    borderColor: "#2f6f62",
    backgroundColor: "#e3eee9",
  },
  optionButtonText: {
    color: "#1f2a2e",
    fontSize: 14,
    fontWeight: "700",
  },
  optionButtonTextSelected: {
    color: "#2f6f62",
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomColor: "#e5ded3",
    borderBottomWidth: 1,
  },
  toggleLabel: {
    flex: 1,
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "700",
  },
  toggleValue: {
    color: "#6d746f",
    fontSize: 15,
    fontWeight: "800",
  },
  toggleValueOn: {
    color: "#2f6f62",
  },
  note: {
    color: "#52605f",
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#b65353",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: "#9b3f3f",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#cfc6ba",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "800",
  },
  disabledButton: {
    borderColor: "#d6d1c8",
    backgroundColor: "#f4f1eb",
  },
  disabledButtonText: {
    color: "#8b9692",
  },
  infoRow: {
    gap: 4,
  },
  infoValue: {
    color: "#1f2a2e",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  notice: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
    borderWidth: 1,
  },
  noticeText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
});
