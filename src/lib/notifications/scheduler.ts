import {
  notificationStorage,
} from "./storage";

import {
  showNotification,
} from "./bridge";

import type {
  NotificationTask,
} from "./types";

const timers = new Map<
  string,
  number
>();

function scheduleTimer(
  notification: NotificationTask,
): void {
  const due =
    new Date(
      notification.dueAt,
    ).getTime();

  const delay =
    due - Date.now();

  if (delay <= 0) {
    return;
  }

  const timer = window.setTimeout(
    async () => {
      await triggerNotification(
        notification.id,
      );
    },
    delay,
  );

  timers.set(
    notification.id,
    timer,
  );
}

export function schedule(
  notification: NotificationTask,
): void {
  notification.status =
    "scheduled";

  notification.updatedAt =
    new Date().toISOString();

  notificationStorage.save(
    notification,
  );

  scheduleTimer(
    notification,
  );
}

export async function triggerNotification(
  notificationId: string,
): Promise<void> {
  const notification =
    notificationStorage.find(
      notificationId,
    );

  if (!notification) {
    return;
  }

  await showNotification(
    notification,
  );

  notification.status =
    "displayed";

  notification.lastTriggeredAt =
    new Date().toISOString();

  notification.updatedAt =
    notification.lastTriggeredAt;

  notificationStorage.update(
    notification,
  );

  timers.delete(
    notification.id,
  );
}

export function restore(): void {
  const notifications =
    notificationStorage.pending();

  notifications.forEach(
    scheduleTimer,
  );
}

export function cancel(
  notificationId: string,
): void {
  const timer =
    timers.get(
      notificationId,
    );

  if (timer !== undefined) {
    clearTimeout(
      timer,
    );

    timers.delete(
      notificationId,
    );
  }

  const notification =
    notificationStorage.find(
      notificationId,
    );

  if (!notification) {
    return;
  }

  notification.status =
    "cancelled";

  notification.updatedAt =
    new Date().toISOString();

  notificationStorage.update(
    notification,
  );
}

export function cancelByTaskId(
  taskId: string | number,
): void {
  const notification =
    notificationStorage.findByTaskId(
      taskId,
    );

  if (!notification) {
    return;
  }

  cancel(
    notification.id,
  );
}

export function clearAllSchedules(): void {
  timers.forEach(
    (timer) =>
      clearTimeout(timer),
  );

  timers.clear();
}

export function getScheduledCount(): number {
  return timers.size;
}