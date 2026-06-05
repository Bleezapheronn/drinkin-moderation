import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { DrinkingSession, SessionNotificationIds } from "../context/session";

const dimNotificationChannelId = "dim-session-reminders";

// DIM uses only local notification APIs here. Expo Go may still log its Android
// remote push warning when this module imports expo-notifications; we do not call
// push token APIs or configure remote push delivery.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
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

export async function requestReminderPermissions(): Promise<ReminderPermissionStatus> {
  try {
    await ensureAndroidChannel();

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
): Promise<ReminderScheduleResult> {
  try {
    await cancelSessionReminders(session.notificationIds);

    if (!session.nextAllowedDrinkAt || session.nextAllowedDrinkAt <= Date.now()) {
      return { ids: null, status: "granted" };
    }

    const status = await requestReminderPermissions();

    if (status !== "granted") {
      return { ids: null, status };
    }

    const nextDrinkReminderId = await Notifications.scheduleNotificationAsync({
      content: {
        body: "Your interval is complete. Check in before deciding on another drink.",
        data: { source: "dim", type: "next-drink" },
        title: "Next drink window",
      },
      trigger: {
        channelId: dimNotificationChannelId,
        date: new Date(session.nextAllowedDrinkAt),
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });

    const waterReminderAt = getWaterReminderTime(session);
    const waterReminderId =
      waterReminderAt && waterReminderAt > Date.now()
        ? await Notifications.scheduleNotificationAsync({
            content: {
              body: "Have some water and slow the pace.",
              data: { source: "dim", type: "water" },
              title: "Water check",
            },
            trigger: {
              channelId: dimNotificationChannelId,
              date: new Date(waterReminderAt),
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
          })
        : null;

    return {
      ids: {
        nextDrinkReminderId,
        waterReminderId,
      },
      status: "granted",
    };
  } catch {
    return { ids: null, status: "error" };
  }
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
): Promise<ReminderScheduleResult> {
  if (!session.nextAllowedDrinkAt || session.nextAllowedDrinkAt <= Date.now()) {
    await cancelSessionReminders(session.notificationIds);
    return { ids: null, status: "unknown" };
  }

  if (session.notificationIds && (await areSessionRemindersScheduled(session.notificationIds))) {
    return { ids: session.notificationIds, status: "granted" };
  }

  return scheduleSessionReminders(session);
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

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(dimNotificationChannelId, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "DIM session reminders",
  });
}

function getWaterReminderTime(session: DrinkingSession) {
  if (!session.nextAllowedDrinkAt) {
    return null;
  }

  const intervalMilliseconds = session.intervalMinutes * 60 * 1000;
  const reminderTime = session.nextAllowedDrinkAt - intervalMilliseconds / 2;

  return reminderTime > Date.now() ? reminderTime : null;
}
