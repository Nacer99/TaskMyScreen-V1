import {
  DEFAULT_THEME,
  FREE_PLAN,
  getActionsForPlan,
} from "./constants";

import type {
  NotificationTask,
} from "./types";

export interface NotificationRenderResult {
  title: string;
  options: NotificationOptions;
}

export function buildNotification(
  notification: NotificationTask,
): NotificationRenderResult {

  const actions = getActionsForPlan(
    notification.plan,
  );

  const maxActions =
    (
      Notification as typeof Notification & {
        maxActions?: number;
      }
    ).maxActions ?? 2;

  const visibleActions = actions
    .slice(0, maxActions)
    .map((action) => ({
      action: action.action,
      title: action.title,
    }));

  const options = {
    body: notification.body,

    icon: DEFAULT_THEME.icon,

    badge: DEFAULT_THEME.badge,

    image: notification.imageUrl,

    tag: `task-${notification.taskId}`,

    renotify: true,

    requireInteraction:
      DEFAULT_THEME.requireInteraction,

    vibrate:
      DEFAULT_THEME.vibrate,

    actions: visibleActions,

    data: {
      notificationId:
        notification.id,

      taskId:
        notification.taskId,

      plan:
        notification.plan,

      dueAt:
        notification.dueAt,

      imageUrl:
        notification.imageUrl,

      version:
        notification.version,
    },
  } as NotificationOptions & {
    image?: string;
  };

  return {
    title: notification.title,
    options,
  };
}

export function canReschedule(
  notification: NotificationTask,
): boolean {
  return notification.plan !== FREE_PLAN;
}

export function canSnooze(
  notification: NotificationTask,
): boolean {
  return notification.plan !== FREE_PLAN;
}

export function cloneNotification(
  notification: NotificationTask,
): NotificationTask {
  return structuredClone(notification);
}