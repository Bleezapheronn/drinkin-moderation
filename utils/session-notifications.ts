import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { ReminderSoundSetting } from "../context/settings";
import type { DrinkingSession, SessionNotificationIds } from "../context/session";

type PhoneReminderKind = "interval" | "go-home";

const fallbackSoundSetting: ReminderSoundSetting = {
  choice: "system",
  deviceFile: null,
};

const builtInSoundFiles: Record<PhoneReminderKind, string> = {
  "go-home": "go_home.mp3",
  interval: "interval.mp3",
};

const notificationChannels: Record<
  PhoneReminderKind,
  { builtIn: string; default: string; silent: string }
> = {
  "go-home": {
    builtIn: "dim-go-home-built-in-v1",
    default: "dim-go-home-default-v1",
    silent: "dim-go-home-silent-v1",
  },
  interval: {
    builtIn: "dim-interval-built-in-v1",
    default: "dim-interval-default-v1",
    silent: "dim-interval-silent-v1",
  },
};

// OMD uses only local notification APIs here. Expo Go may still log its Android
// remote push warning when this module imports expo-notifications; we do not call
// push token APIs or configure remote push delivery.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ReminderPermissionStatus = "unknown" | "granted" | "denied" | "error";

export type ReminderScheduleResult = {
  ids: SessionNotificationIds | null;
  status: ReminderPermissionStatus;
};

export type ReminderPreferences = {
  intervalReminderSound?: ReminderSoundSetting;
  nextDrinkPhoneNotifications: boolean;
};

type BehavioralReminderInput = {
  body: string;
  isPhoneNotificationEnabled?: boolean;
  soundSetting?: ReminderSoundSetting;
  title: string;
  type: "food" | "go-home";
};

export async function requestReminderPermissions(): Promise<ReminderPermissionStatus> {
  try {
    await ensureAndroidReminderChannels();

    const existingPermission = await Notifications.getPermissionsAsync();

    if (existingPermission.granted) {
      return "granted";
    }

    const requestedPermission = await Notifications.requestPermissionsAsync();

    return requestedPermission.granted ? "granted" : "denied";
  } catch {
    return "error";
  }
}

export async function scheduleSessionReminders(
  session: DrinkingSession,
  preferences: ReminderPreferences = { nextDrinkPhoneNotifications: true },
): Promise<ReminderScheduleResult> {
  try {
    await cancelSessionReminders(session.notificationIds);

    if (
      !preferences.nextDrinkPhoneNotifications ||
      !session.nextAllowedDrinkAt ||
      session.nextAllowedDrinkAt <= Date.now()
    ) {
      return { ids: null, status: "granted" };
    }

    const status = await requestReminderPermissions();

    if (status !== "granted") {
      return { ids: null, status };
    }

    const soundBehavior = getNotificationSoundBehavior(
      "interval",
      preferences.intervalReminderSound,
    );
    await ensureAndroidReminderChannel(soundBehavior.channelId, soundBehavior.channelSound);

    const nextDrinkReminderId = await Notifications.scheduleNotificationAsync({
      content: {
        body: "Your interval is complete. Check in before deciding on another drink.",
        data: {
          source: "dim",
          soundChoice: soundBehavior.choice,
          soundLimitation: soundBehavior.limitation,
          type: "next-drink",
        },
        sound: soundBehavior.contentSound,
        title: "Next drink window",
      },
      trigger: {
        channelId: soundBehavior.channelId,
        date: new Date(session.nextAllowedDrinkAt),
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });

    return {
      ids: {
        nextDrinkReminderId,
        waterReminderId: null,
      },
      status: "granted",
    };
  } catch {
    return { ids: null, status: "error" };
  }
}

export async function sendBehavioralReminder(input: BehavioralReminderInput) {
  if (input.type === "food") {
    return "granted";
  }

  if (input.type === "go-home" && input.isPhoneNotificationEnabled === false) {
    return "granted";
  }

  const status = await requestReminderPermissions();

  if (status !== "granted") {
    return status;
  }

  try {
    const reminderKind: PhoneReminderKind = input.type === "go-home" ? "go-home" : "interval";
    const soundBehavior = getNotificationSoundBehavior(reminderKind, input.soundSetting);
    await ensureAndroidReminderChannel(soundBehavior.channelId, soundBehavior.channelSound);

    await Notifications.scheduleNotificationAsync({
      content: {
        body: input.body,
        data: {
          source: "dim",
          soundChoice: soundBehavior.choice,
          soundLimitation: soundBehavior.limitation,
          type: input.type,
        },
        sound: soundBehavior.contentSound,
        title: input.title,
      },
      trigger: {
        channelId: soundBehavior.channelId,
        seconds: 1,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  } catch {
    return "error";
  }

  return "granted";
}

export async function scheduleTestReminderSound(
  kind: PhoneReminderKind,
  soundSetting: ReminderSoundSetting,
): Promise<ReminderPermissionStatus> {
  const status = await requestReminderPermissions();

  if (status !== "granted") {
    return status;
  }

  try {
    const soundBehavior = getNotificationSoundBehavior(kind, soundSetting);
    await ensureAndroidReminderChannel(soundBehavior.channelId, soundBehavior.channelSound);

    await Notifications.scheduleNotificationAsync({
      content: {
        body:
          kind === "interval"
            ? "Test notification for the next-drink reminder."
            : "Test notification for the go-home reminder.",
        data: {
          source: "dim",
          soundChoice: soundBehavior.choice,
          soundLimitation: soundBehavior.limitation,
          type: `${kind}-sound-test`,
        },
        sound: soundBehavior.contentSound,
        title: kind === "interval" ? "Next drink window" : "Time to wrap up",
      },
      trigger: {
        channelId: soundBehavior.channelId,
        seconds: 3,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  } catch {
    return "error";
  }

  return "granted";
}

export async function cancelSessionReminders(ids: SessionNotificationIds | null): Promise<void> {
  if (!ids) {
    return;
  }

  await Promise.all([
    cancelReminder(ids.nextDrinkReminderId),
    cancelReminder(ids.waterReminderId),
  ]);
}

export async function cancelAllDimSessionReminders(): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const dimNotifications = scheduledNotifications.filter(
    (notification) => notification.content.data?.source === "dim",
  );

  await Promise.all(
    dimNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

export async function reconcileSessionReminders(
  session: DrinkingSession,
  preferences: ReminderPreferences = { nextDrinkPhoneNotifications: true },
): Promise<ReminderScheduleResult> {
  if (
    !preferences.nextDrinkPhoneNotifications ||
    !session.nextAllowedDrinkAt ||
    session.nextAllowedDrinkAt <= Date.now()
  ) {
    await cancelSessionReminders(session.notificationIds);
    return { ids: null, status: "unknown" };
  }

  if (session.notificationIds && (await areSessionRemindersScheduled(session.notificationIds))) {
    return { ids: session.notificationIds, status: "granted" };
  }

  return scheduleSessionReminders(session, preferences);
}

async function areSessionRemindersScheduled(ids: SessionNotificationIds) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduledNotifications.map((notification) => notification.identifier));

  return (
    scheduledIds.has(ids.nextDrinkReminderId) &&
    (ids.waterReminderId === null || scheduledIds.has(ids.waterReminderId))
  );
}

async function cancelReminder(id: string | null) {
  if (!id) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // If the reminder is already gone, there is nothing useful for the user to do.
  }
}

function getNotificationSoundBehavior(
  kind: PhoneReminderKind,
  setting: ReminderSoundSetting = fallbackSoundSetting,
) {
  const choice = setting.choice;
  const isSilent = choice === "silent";
  const isBuiltIn = choice === "built-in";
  const channelId = isSilent
    ? notificationChannels[kind].silent
    : isBuiltIn
      ? notificationChannels[kind].builtIn
      : notificationChannels[kind].default;
  const builtInSound = builtInSoundFiles[kind];

  return {
    channelId,
    choice,
    channelSound: isBuiltIn ? builtInSound : isSilent ? null : undefined,
    contentSound: isBuiltIn ? builtInSound : isSilent ? false : true,
    isSilent,
    limitation: choice === "device-file" ? "device-file-notification-sound-unsupported" : null,
  };
}

async function ensureAndroidReminderChannels() {
  await Promise.all([
    ensureAndroidReminderChannel(notificationChannels.interval.default),
    ensureAndroidReminderChannel(notificationChannels.interval.silent, null),
    ensureAndroidReminderChannel(notificationChannels.interval.builtIn, builtInSoundFiles.interval),
    ensureAndroidReminderChannel(notificationChannels["go-home"].default),
    ensureAndroidReminderChannel(notificationChannels["go-home"].silent, null),
    ensureAndroidReminderChannel(
      notificationChannels["go-home"].builtIn,
      builtInSoundFiles["go-home"],
    ),
  ]);
}

async function ensureAndroidReminderChannel(channelId: string, sound?: string | null) {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(channelId, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: getAndroidChannelName(channelId),
    sound,
  });
}

function getAndroidChannelName(channelId: string) {
  if (channelId.includes("go-home")) {
    return channelId.includes("silent") ? "OMD go-home reminders silent" : "OMD go-home reminders";
  }

  return channelId.includes("silent") ? "OMD interval reminders silent" : "OMD interval reminders";
}
