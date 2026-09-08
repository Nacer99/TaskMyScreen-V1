import {
  getActionsForPlan,
  MAX_SNOOZE_COUNT,
  NOTIFICATION_VERSION,
  SNOOZE_DELAY_MS,
} from "./constants";

import {
  notificationStorage,
} from "./storage";

import * as scheduler from "./scheduler";

import type {
  NotificationEngineState,
  NotificationPlan,
  NotificationTask,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

function createNotificationId(
  taskId: string | number,
): string {
  return `notif-${taskId}`;
}

export function createNotification(
  params: {
    taskId: string | number;
    title: string;
    body: string;
    dueAt: string;
    imageUrl?: string;
    plan?: NotificationPlan;
  },
): NotificationTask {
  const timestamp = now();

  const notification: NotificationTask = {
    id: createNotificationId(
      params.taskId,
    ),

    taskId: params.taskId,

    title: params.title,

    body: params.body,

    imageUrl: params.imageUrl,

    dueAt: params.dueAt,

    plan:
      params.plan ??
      "free",

    status: "pending",

    actions:
      getActionsForPlan(
        params.plan ??
          "free",
      ),

    snoozeCount: 0,

    version:
      NOTIFICATION_VERSION,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  };

  notificationStorage.save(
    notification,
  );

  return notification;
}

export function scheduleNotification(
  notification: NotificationTask,
): void {
  scheduler.schedule(
    notification,
  );
}

export function scheduleTask(
  params: {
    taskId: string | number;
    title: string;
    body: string;
    dueAt: string;
    imageUrl?: string;
    plan?: NotificationPlan;
  },
): NotificationTask {
  const notification =
    createNotification(
      params,
    );

  scheduleNotification(
    notification,
  );

  return notification;
}

export function completeTask(
  taskId: string | number,
): void {
  const notification =
    notificationStorage.findByTaskId(
      taskId,
    );

  if (!notification) {
    return;
  }

  notification.status =
    "completed";

  notification.updatedAt =
    now();

  notificationStorage.update(
    notification,
  );

  scheduler.cancel(
    notification.id,
  );
}

export function dismissTask(
  taskId: string | number,
): void {
  const notification =
    notificationStorage.findByTaskId(
      taskId,
    );

  if (!notification) {
    return;
  }

  notification.status =
    "dismissed";

  notification.updatedAt =
    now();

  notificationStorage.update(
    notification,
  );
}

export function cancelTask(
  taskId: string | number,
): void {
  scheduler.cancelByTaskId(
    taskId,
  );
}

/**
 * Pushes a notification's dueAt forward by SNOOZE_DELAY_MS and reschedules
 * its timer. Free plan cannot snooze (enforced by getActionsForPlan not
 * offering the button, and again here since a message can't be trusted to
 * only ever arrive from an entitled client). Returns null if the task has no
 * notification, is not snoozable (free plan or MAX_SNOOZE_COUNT reached), or
 * has already fired/been cancelled.
 *
 * NOT WIRED TO ANY UI AT LAUNCH — Snooze is deliberately deferred pending
 * real user feedback (product decision). This function is kept, tested, and
 * exported so re-enabling the feature later is: (1) add the button back to
 * PRO_ACTIONS in constants.ts, (2) restore the ACTION_SNOOZE case in
 * public/sw.js, (3) restore the TASK_SNOOZE handler in use-sw-messages.ts —
 * no changes needed here.
 */
export function snoozeTask(
  taskId: string | number,
): NotificationTask | null {
  const notification =
    notificationStorage.findByTaskId(
      taskId,
    );

  if (!notification) {
    return null;
  }

  if (notification.plan === "free") {
    return null;
  }

  if (
    notification.snoozeCount >=
    MAX_SNOOZE_COUNT
  ) {
    return null;
  }

  if (
    notification.status === "completed" ||
    notification.status === "cancelled" ||
    notification.status === "dismissed"
  ) {
    return null;
  }

  const timestamp = now();

  notification.dueAt = new Date(
    Date.now() + SNOOZE_DELAY_MS,
  ).toISOString();

  notification.snoozeCount += 1;
  notification.updatedAt = timestamp;

  scheduler.schedule(
    notification,
  );

  return notification;
}

export function restoreNotifications(): void {
  scheduler.restore();
}

export function clearNotifications(): void {
  scheduler.clearAllSchedules();

  notificationStorage.clear();
}

export function getNotification(
  taskId: string | number,
): NotificationTask | undefined {
  return notificationStorage.findByTaskId(
    taskId,
  );
}

export function getAllNotifications(): NotificationTask[] {
  return notificationStorage.list();
}

export function getEngineState(): NotificationEngineState {
  const notifications =
    notificationStorage.list();

  return {
    pending:
      notifications.filter(
        (n) =>
          n.status ===
          "pending",
      ).length,

    scheduled:
      notifications.filter(
        (n) =>
          n.status ===
          "scheduled",
      ).length,

    displayed:
      notifications.filter(
        (n) =>
          n.status ===
          "displayed",
      ).length,
  };
}