import type {
  NotificationAction,
  NotificationActionButton,
  NotificationPlan,
  NotificationTheme,
} from "./types";

/**
 * Service Worker
 */
export const SW_PATH = "/sw.js";

/**
 * Local Storage
 */
export const STORAGE_KEY =
  "taskmyscreen.notifications";

/**
 * Assets
 */
export const NOTIFICATION_ICON =
  "/notification-icon.svg";

export const NOTIFICATION_BADGE =
  "/badge-icon.svg";

/**
 * Notification defaults
 */
export const NOTIFICATION_VERSION = 1;

// Snooze is deliberately not offered at launch (see engine.ts's snoozeTask
// doc comment) — these two constants stay defined, unused by
// getActionsForPlan below, so re-enabling later is a one-line change rather
// than rebuilding the feature.
export const MAX_SNOOZE_COUNT = 3;

export const SNOOZE_DELAY_MS =
  15 * 60 * 1000;

/**
 * Notification actions
 */
export const ACTION_MARK_DONE: NotificationAction =
  "MARK_DONE";

export const ACTION_RESCHEDULE: NotificationAction =
  "RESCHEDULE";

export const ACTION_SNOOZE_15: NotificationAction =
  "SNOOZE_15";

export const ACTION_SEE_TASK: NotificationAction =
  "SEE_TASK";

/**
 * Button labels
 */
export const LABEL_MARK_DONE =
  "Mark Done";

export const LABEL_RESCHEDULE =
  "Reschedule";

export const LABEL_SNOOZE =
  "Snooze 15 min";

export const LABEL_SEE_TASK =
  "See Task";

/**
 * Plans
 */
export const FREE_PLAN: NotificationPlan =
  "free";

export const PRO_PLAN: NotificationPlan =
  "pro";

export const LIFETIME_PLAN: NotificationPlan =
  "lifetime";

/**
 * Theme
 */
export const DEFAULT_THEME: NotificationTheme = {
  icon: NOTIFICATION_ICON,
  badge: NOTIFICATION_BADGE,
  vibrate: [200, 100, 200, 100, 400],
  requireInteraction: false,
};

/**
 * Actions
 */
export const FREE_ACTIONS: NotificationActionButton[] =
  [
    {
      action: ACTION_SEE_TASK,
      title: LABEL_SEE_TASK,
    },
  ];

export const PRO_ACTIONS: NotificationActionButton[] =
  [
    {
      action: ACTION_SEE_TASK,
      title: LABEL_SEE_TASK,
    },
    {
      action: ACTION_RESCHEDULE,
      title: LABEL_RESCHEDULE,
    },
    // Snooze intentionally omitted at launch — see engine.ts's snoozeTask
    // doc comment. Re-add `{ action: ACTION_SNOOZE_15, title: LABEL_SNOOZE }`
    // here to bring it back.
  ];

/**
 * Helpers
 */
export function getActionsForPlan(
  plan: NotificationPlan,
): NotificationActionButton[] {
  if (plan === FREE_PLAN) {
    return FREE_ACTIONS;
  }

  return PRO_ACTIONS;
}