import {
  getActionsForPlan,
  NOTIFICATION_VERSION,
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