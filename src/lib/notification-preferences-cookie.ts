// Shared between the notifications module (reads it server-side to filter
// the list, writes it from the preferences toggles) so the name/shape can't
// drift between the two.
export const NOTIFICATION_PREFS_COOKIE_NAME = "notification-prefs";

export type NotificationCategory = "budget" | "goal" | "payment" | "shared";
export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  budget: true,
  goal: true,
  payment: true,
  shared: true,
};

export function parseNotificationPreferences(value: string | undefined): NotificationPreferences {
  if (!value) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;
    return {
      budget: parsed.budget ?? true,
      goal: parsed.goal ?? true,
      payment: parsed.payment ?? true,
      shared: parsed.shared ?? true,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}
